import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { apiLogger } from './services/logger.service';
import { loggingMiddleware } from './middleware/logging.middleware';
import { ocrRateLimit, apiRateLimit } from './middleware/rate-limit.middleware';

// Import routes
import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import reportsRoutes from './routes/reports';
import transactionsRoutes from './routes/transactions';
import itemsRoutes from './routes/items.routes';
import importRoutes from './routes/import.routes';
import exportRoutes from './routes/export.routes';
import returnRoutes from './routes/return.routes';
import wasteRoutes from './routes/waste.routes';
import ocrRoutes from './routes/ocr';
import ocrFormRoutes from './routes/ocr-form.routes';
import formTemplateRoutes from './routes/form-template.routes';

const app: Application = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(loggingMiddleware);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Rate limiting
app.use('/api/ocr', ocrRateLimit);
app.use('/api', apiRateLimit);

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/return', returnRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/ocr-form', ocrFormRoutes);
app.use('/api/form-template', formTemplateRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  apiLogger.error(req, err);
  res.status(500).json({
    message: 'Đã xảy ra lỗi',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

export default app; 