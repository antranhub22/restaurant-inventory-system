import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import transactionRoutes from './routes/transactions';
import reportRoutes from './routes/reports';
import ocrRoutes from './routes/ocr';
import importRoutes from './routes/import.routes';
import exportRoutes from './routes/export.routes';
import returnRoutes from './routes/return.routes';
import wasteRoutes from './routes/waste.routes';
import ocrFormRoutes from './routes/ocr-form.routes';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  
  // Log response
  const oldSend = res.send;
  res.send = function (data: any): Response {
    console.log('\n📤 Response:', data);
    return oldSend.apply(res, arguments as any);
  };
  
  next();
});

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Logging middleware
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint - không cần auth
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Kiểm tra database
    const dbStatus = await prisma.$queryRaw`SELECT 1`;
    
    // Kiểm tra Redis (không bắt buộc)
    const redisService = (await import('./services/redis.service')).default.getInstance();
    const redisStatus = redisService.isAvailable();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'not configured'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Root route handler
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    message: 'Restaurant Inventory System API',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/wastes', wasteRoutes);
app.use('/api/ocr-forms', ocrFormRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app; 