import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, businessName, businessId, address, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        businessName,
        businessId,
        address,
        phone,
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        businessId: user.businessId,
        address: user.address,
        phone: user.phone,
        role: user.role,
        logo: user.logo,
        vatRate: user.vatRate,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        businessId: user.businessId,
        address: user.address,
        phone: user.phone,
        role: user.role,
        logo: user.logo,
        vatRate: user.vatRate,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        businessName: true,
        businessId: true,
        address: true,
        phone: true,
        role: true,
        logo: true,
        vatRate: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { businessName, businessId, address, phone, logo, vatRate } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        businessName,
        businessId,
        address,
        phone,
        logo,
        vatRate,
      },
      select: {
        id: true,
        email: true,
        businessName: true,
        businessId: true,
        address: true,
        phone: true,
        role: true,
        logo: true,
        vatRate: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;


