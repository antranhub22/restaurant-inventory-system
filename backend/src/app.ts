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
import migrationRoutes from './routes/migration.routes';
import healthRoutes from './routes/health';

const app: Application = express();
const prisma = new PrismaClient();

// Trust proxy for Render deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

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

// Enhanced health check endpoint for Render monitoring
app.get('/api/health', async (req: Request, res: Response) => {
  const healthCheck: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'unknown',
      provider: 'unknown',
      lastChecked: new Date().toISOString()
    },
    services: {
      redis: false
    }
  };

  try {
    // Test database connection with timeout
    console.log('🔍 Health check: Testing database...');
    
    const dbPromise = prisma.$queryRaw`SELECT 
      version() as version, 
      current_database() as database,
      current_user as user,
      now() as current_time`;
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );
    
    const result: any = await Promise.race([dbPromise, timeoutPromise]);
    
    healthCheck.database = {
      status: 'connected',
      provider: result[0]?.version?.includes('PostgreSQL') ? 'PostgreSQL' : 'Unknown',
      version: result[0]?.version?.split(' ')[1] || 'Unknown',
      database: result[0]?.database || 'Unknown',
      user: result[0]?.user || 'Unknown',
      lastChecked: new Date().toISOString()
    };
    
    console.log('✅ Health check: Database connected');
    
  } catch (error: any) {
    console.error('❌ Health check: Database failed:', error?.message);
    
    healthCheck.status = 'unhealthy';
    healthCheck.database = {
      status: 'disconnected',
      provider: 'PostgreSQL',
      error: error?.message || 'Connection failed',
      errorCode: error?.code || 'Unknown',
      lastChecked: new Date().toISOString()
    };
  }

  // Check Redis connection (optional)
  try {
    // This is a simple check - you can expand it if using Redis
    healthCheck.services.redis = !!process.env.REDIS_URL;
  } catch (error) {
    healthCheck.services.redis = false;
  }

  // Return appropriate status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(healthCheck);
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
app.use('/api/migration', migrationRoutes);
app.use('/api/health', healthRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  apiLogger.error(req, err);
  res.status(500).json({
    message: 'Đã xảy ra lỗi',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

export default app; 