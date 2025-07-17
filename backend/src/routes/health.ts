import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Health check endpoint for Render
router.get('/', async (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'disconnected',
      provider: 'PostgreSQL',
      error: null,
      errorCode: null,
      lastChecked: new Date().toISOString()
    },
    services: {
      redis: !!process.env.REDIS_URL
    }
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    healthData.database.status = 'connected';
    healthData.status = 'healthy';
  } catch (error: any) {
    healthData.database.status = 'disconnected';
    healthData.database.error = error.message;
    healthData.database.errorCode = error.code;
    healthData.status = 'unhealthy';
  }

  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  (res as any).status(statusCode).json(healthData);
});

export default router; 