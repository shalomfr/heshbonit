import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import productRoutes from './routes/products';
import documentRoutes from './routes/documents';
import reportRoutes from './routes/reports';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Export prisma for use in other files
export { prisma };

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

