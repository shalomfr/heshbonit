import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest, requireEditor } from '../middleware/auth';

const router = Router();

// Get all clients
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { userId: req.userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { businessId: { contains: search as string } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      clients,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to get clients' });
  }
});

// Get single client
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to get client' });
  }
});

// Create client
router.post('/', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const { name, businessId, address, city, phone, email, notes } = req.body;

    const client = await prisma.client.create({
      data: {
        userId: req.userId!,
        name,
        businessId,
        address,
        city,
        phone,
        email,
        notes,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client
router.put('/:id', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const { name, businessId, address, city, phone, email, notes } = req.body;

    // Check ownership
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { name, businessId, address, city, phone, email, notes },
    });

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, requireEditor, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await prisma.client.delete({ where: { id: req.params.id } });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;

