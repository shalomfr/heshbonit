import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Dashboard stats
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get monthly revenue
    const monthlyDocs = await prisma.document.findMany({
      where: {
        userId: req.userId,
        type: { in: ['INVOICE', 'INVOICE_RECEIPT'] },
        status: { in: ['SENT', 'PAID'] },
        issueDate: { gte: startOfMonth },
      },
    });
    const monthlyRevenue = monthlyDocs.reduce((sum, doc) => sum + doc.total, 0);
    const monthlyVat = monthlyDocs.reduce((sum, doc) => sum + doc.vatAmount, 0);

    // Get yearly revenue
    const yearlyDocs = await prisma.document.findMany({
      where: {
        userId: req.userId,
        type: { in: ['INVOICE', 'INVOICE_RECEIPT'] },
        status: { in: ['SENT', 'PAID'] },
        issueDate: { gte: startOfYear },
      },
    });
    const yearlyRevenue = yearlyDocs.reduce((sum, doc) => sum + doc.total, 0);
    const yearlyVat = yearlyDocs.reduce((sum, doc) => sum + doc.vatAmount, 0);

    // Get counts
    const [clientCount, productCount, pendingInvoices] = await Promise.all([
      prisma.client.count({ where: { userId: req.userId } }),
      prisma.product.count({ where: { userId: req.userId } }),
      prisma.document.count({
        where: {
          userId: req.userId,
          type: { in: ['INVOICE', 'INVOICE_RECEIPT'] },
          status: 'SENT',
        },
      }),
    ]);

    // Recent documents
    const recentDocuments = await prisma.document.findMany({
      where: { userId: req.userId },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Monthly chart data (last 6 months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthDocs = await prisma.document.findMany({
        where: {
          userId: req.userId,
          type: { in: ['INVOICE', 'INVOICE_RECEIPT'] },
          status: { in: ['SENT', 'PAID'] },
          issueDate: { gte: monthStart, lte: monthEnd },
        },
      });
      
      chartData.push({
        month: monthStart.toLocaleDateString('he-IL', { month: 'short' }),
        revenue: monthDocs.reduce((sum, doc) => sum + doc.total, 0),
        count: monthDocs.length,
      });
    }

    res.json({
      monthlyRevenue,
      monthlyVat,
      yearlyRevenue,
      yearlyVat,
      clientCount,
      productCount,
      pendingInvoices,
      recentDocuments,
      chartData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// VAT Report
router.get('/vat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, period } = req.query;

    let start: Date;
    let end: Date;

    if (period === 'monthly') {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'bimonthly') {
      const now = new Date();
      const bimonthStart = Math.floor(now.getMonth() / 2) * 2;
      start = new Date(now.getFullYear(), bimonthStart, 1);
      end = new Date(now.getFullYear(), bimonthStart + 2, 0);
    } else if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      // Default to current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const documents = await prisma.document.findMany({
      where: {
        userId: req.userId,
        type: { in: ['INVOICE', 'INVOICE_RECEIPT', 'RECEIPT'] },
        status: { in: ['SENT', 'PAID'] },
        issueDate: { gte: start, lte: end },
      },
      include: { client: { select: { name: true, businessId: true } } },
      orderBy: { issueDate: 'asc' },
    });

    const summary = {
      totalTransactions: documents.length,
      totalSubtotal: documents.reduce((sum, doc) => sum + doc.subtotal, 0),
      totalVat: documents.reduce((sum, doc) => sum + doc.vatAmount, 0),
      totalAmount: documents.reduce((sum, doc) => sum + doc.total, 0),
      period: { start, end },
    };

    // Group by document type
    const byType = {
      invoices: documents.filter(d => d.type === 'INVOICE'),
      invoiceReceipts: documents.filter(d => d.type === 'INVOICE_RECEIPT'),
      receipts: documents.filter(d => d.type === 'RECEIPT'),
    };

    res.json({
      summary,
      documents,
      byType,
    });
  } catch (error) {
    console.error('VAT report error:', error);
    res.status(500).json({ error: 'Failed to generate VAT report' });
  }
});

// Income report
router.get('/income', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const documents = await prisma.document.findMany({
      where: {
        userId: req.userId,
        type: { in: ['INVOICE', 'INVOICE_RECEIPT'] },
        status: { in: ['SENT', 'PAID'] },
        issueDate: { gte: start, lte: end },
      },
      include: { client: { select: { name: true } } },
      orderBy: { issueDate: 'asc' },
    });

    // Group data
    const grouped: Record<string, { revenue: number; count: number; documents: any[] }> = {};

    documents.forEach(doc => {
      let key: string;
      if (groupBy === 'day') {
        key = doc.issueDate.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(doc.issueDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${doc.issueDate.getFullYear()}-${String(doc.issueDate.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, count: 0, documents: [] };
      }
      grouped[key].revenue += doc.total;
      grouped[key].count += 1;
      grouped[key].documents.push(doc);
    });

    res.json({
      period: { start, end },
      total: documents.reduce((sum, doc) => sum + doc.total, 0),
      count: documents.length,
      grouped,
    });
  } catch (error) {
    console.error('Income report error:', error);
    res.status(500).json({ error: 'Failed to generate income report' });
  }
});

// Client report
router.get('/clients', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const clients = await prisma.client.findMany({
      where: { userId: req.userId },
      include: {
        documents: {
          where: {
            type: { in: ['INVOICE', 'INVOICE_RECEIPT'] },
            status: { in: ['SENT', 'PAID'] },
            issueDate: { gte: start, lte: end },
          },
        },
      },
    });

    const clientStats = clients.map(client => ({
      id: client.id,
      name: client.name,
      documentCount: client.documents.length,
      totalRevenue: client.documents.reduce((sum, doc) => sum + doc.total, 0),
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      period: { start, end },
      clients: clientStats,
    });
  } catch (error) {
    console.error('Client report error:', error);
    res.status(500).json({ error: 'Failed to generate client report' });
  }
});

export default router;


