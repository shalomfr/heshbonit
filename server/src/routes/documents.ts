import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest, requireEditor } from '../middleware/auth';
import { generatePDF } from '../services/pdf';

const router = Router();

// Get all documents
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      search, 
      type, 
      status, 
      clientId,
      startDate, 
      endDate,
      page = '1', 
      limit = '20' 
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId: req.userId };
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(startDate as string);
      if (endDate) where.issueDate.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { documentNumber: parseInt(search as string) || 0 },
        { client: { name: { contains: search as string, mode: 'insensitive' } } },
        { notes: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          client: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.document.count({ where }),
    ]);

    res.json({
      documents,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Get single document
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        client: true,
        items: { include: { product: true } },
        user: {
          select: {
            businessName: true,
            businessId: true,
            address: true,
            phone: true,
            logo: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// Get next document number
router.get('/next-number/:type', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;
    
    const lastDoc = await prisma.document.findFirst({
      where: { userId: req.userId, type: type as any },
      orderBy: { documentNumber: 'desc' },
    });

    res.json({ nextNumber: (lastDoc?.documentNumber || 0) + 1 });
  } catch (error) {
    console.error('Get next number error:', error);
    res.status(500).json({ error: 'Failed to get next number' });
  }
});

// Create document
router.post('/', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      clientId, 
      type, 
      status,
      issueDate, 
      dueDate, 
      notes, 
      items,
      vatRate 
    } = req.body;

    // Get next document number
    const lastDoc = await prisma.document.findFirst({
      where: { userId: req.userId, type },
      orderBy: { documentNumber: 'desc' },
    });
    const documentNumber = (lastDoc?.documentNumber || 0) + 1;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    const userVatRate = vatRate ?? 17;
    const vatAmount = subtotal * (userVatRate / 100);
    const total = subtotal + vatAmount;

    // Create document with items
    const document = await prisma.document.create({
      data: {
        userId: req.userId!,
        clientId,
        documentNumber,
        type,
        status: status || 'DRAFT',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        vatRate: userVatRate,
        vatAmount,
        total,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Update document
router.put('/:id', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      clientId, 
      status,
      issueDate, 
      dueDate, 
      notes, 
      items,
      vatRate 
    } = req.body;

    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    const userVatRate = vatRate ?? existing.vatRate;
    const vatAmount = subtotal * (userVatRate / 100);
    const total = subtotal + vatAmount;

    // Delete existing items
    await prisma.documentItem.deleteMany({ where: { documentId: req.params.id } });

    // Update document with new items
    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        clientId,
        status,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        vatRate: userVatRate,
        vatAmount,
        total,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    res.json(document);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Update document status
router.patch('/:id/status', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(document);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await prisma.document.delete({ where: { id: req.params.id } });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Generate PDF
router.get('/:id/pdf', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        client: true,
        items: true,
        user: {
          select: {
            businessName: true,
            businessId: true,
            address: true,
            phone: true,
            email: true,
            logo: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const pdfBuffer = await generatePDF(document);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=document-${document.documentNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Convert quote to invoice
router.post('/:id/convert', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.userId, type: 'QUOTE' },
      include: { items: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Get next invoice number
    const lastInvoice = await prisma.document.findFirst({
      where: { userId: req.userId, type: 'INVOICE' },
      orderBy: { documentNumber: 'desc' },
    });
    const documentNumber = (lastInvoice?.documentNumber || 0) + 1;

    // Create invoice from quote
    const invoice = await prisma.document.create({
      data: {
        userId: req.userId!,
        clientId: existing.clientId,
        documentNumber,
        type: 'INVOICE',
        status: 'DRAFT',
        issueDate: new Date(),
        subtotal: existing.subtotal,
        vatRate: existing.vatRate,
        vatAmount: existing.vatAmount,
        total: existing.total,
        notes: existing.notes,
        items: {
          create: existing.items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    // Mark quote as cancelled
    await prisma.document.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Convert quote error:', error);
    res.status(500).json({ error: 'Failed to convert quote' });
  }
});

export default router;

