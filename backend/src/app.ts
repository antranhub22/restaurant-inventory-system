import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Services
import autoMigrationService from './services/auto-migration.service';
import logger from './services/logger.service';

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
import itemsRoutes from './routes/items.routes';

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1); // Tin tưởng proxy để xác định đúng IP client
const prisma = new PrismaClient();

// Auto-migration initialization
let migrationPromise: Promise<any> | null = null;

async function initializeAutoMigration(): Promise<void> {
  if (!autoMigrationService.isEnabled()) {
    logger.info('[AUTO-MIGRATION] Auto-migration is disabled');
    return;
  }

  try {
    const hasChanged = await autoMigrationService.checkDatabaseChange();
    if (hasChanged) {
      logger.info('[AUTO-MIGRATION] Database change detected, starting migration...');
      const result = await autoMigrationService.autoMigrate();
      
      if (result.success) {
        logger.info('[AUTO-MIGRATION] Migration completed successfully', { 
          message: result.message,
          details: result.details 
        });
      } else {
        logger.error('[AUTO-MIGRATION] Migration failed', { 
          message: result.message,
          details: result.details 
        });
      }
    } else {
      logger.info('[AUTO-MIGRATION] No database changes detected');
    }
  } catch (error) {
    logger.error('[AUTO-MIGRATION] Migration initialization failed', { error });
  }
}

// Start migration check (non-blocking)
if (process.env.AUTO_MIGRATION_ENABLED === 'true') {
  migrationPromise = initializeAutoMigration();
}

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.url === '/api/health') return next(); // Bỏ qua log health check
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
    
    // Kiểm tra migration status
    let migrationStatus = 'disabled';
    if (autoMigrationService.isEnabled()) {
      migrationStatus = migrationPromise ? 'in_progress' : 'ready';
    }
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'not configured',
        autoMigration: migrationStatus
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

// Auto-migration status endpoint
app.get('/api/migration/status', async (req: Request, res: Response) => {
  try {
    const isEnabled = autoMigrationService.isEnabled();
    const hasChanged = isEnabled ? await autoMigrationService.checkDatabaseChange() : false;
    
    res.json({
      enabled: isEnabled,
      hasChanges: hasChanged,
      inProgress: migrationPromise !== null,
      currentUrl: process.env.DATABASE_URL ? 'configured' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check migration status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manual migration trigger endpoint
app.post('/api/migration/trigger', async (req: Request, res: Response) => {
  try {
    if (!autoMigrationService.isEnabled()) {
      return res.status(400).json({
        error: 'Auto-migration is disabled',
        message: 'Set AUTO_MIGRATION_ENABLED=true to enable'
      });
    }

    if (migrationPromise) {
      return res.status(409).json({
        error: 'Migration already in progress',
        message: 'Please wait for current migration to complete'
      });
    }

    // Start migration
    migrationPromise = (async () => {
      try {
        const result = await autoMigrationService.autoMigrate();
        logger.info('[MANUAL-MIGRATION] Migration completed', { result });
        return result;
      } finally {
        migrationPromise = null;
      }
    })();

    const result = await migrationPromise;
    
    if (result && result.success) {
      res.json({
        success: true,
        message: result.message,
        details: result.details
      });
    } else {
      res.status(500).json({
        success: false,
        message: result?.message || 'Migration failed',
        details: result?.details
      });
    }
  } catch (error) {
    migrationPromise = null;
    res.status(500).json({
      error: 'Migration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
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
app.use('/api/items', itemsRoutes);
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