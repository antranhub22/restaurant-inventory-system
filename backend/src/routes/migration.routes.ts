import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import logger from '../services/logger.service';

const router = Router();

/**
 * GET /api/migration/status
 * Kiểm tra trạng thái migration
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Test schema existence
      const userCount = await prisma.user.count();
      const itemCount = await prisma.item.count();
      
      await prisma.$disconnect();
      
      res.json({
        success: true,
        message: 'Database schema is ready',
        data: {
          users: userCount,
          items: itemCount,
          schemaStatus: 'ready'
        }
      });
    } catch (schemaError: any) {
      await prisma.$disconnect();
      
      res.json({
        success: false,
        message: 'Database schema missing or incomplete',
        data: {
          schemaStatus: 'missing',
          error: schemaError.message,
          code: schemaError.code
        }
      });
    }
  } catch (error: any) {
    logger.error('[MIGRATION-STATUS] Error checking migration status', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message
    });
  }
});

/**
 * POST /api/migration/trigger
 * Trigger manual migration
 */
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    logger.info('[MIGRATION-TRIGGER] Manual migration triggered');
    
    const results: any = {
      migrate: false,
      push: false,
      generate: false,
      errors: []
    };
    
    // Step 1: Try migrate deploy
    try {
      logger.info('[MIGRATION-TRIGGER] Running prisma migrate deploy...');
      execSync('npx prisma migrate deploy', { stdio: 'pipe' });
      results.migrate = true;
      logger.info('[MIGRATION-TRIGGER] Migrate deploy successful');
    } catch (migrateError: any) {
      logger.warn('[MIGRATION-TRIGGER] Migrate deploy failed, trying push...', { error: migrateError.message });
      results.errors.push(`Migrate failed: ${migrateError.message}`);
      
      // Step 2: Fallback to db push
      try {
        execSync('npx prisma db push', { stdio: 'pipe' });
        results.push = true;
        logger.info('[MIGRATION-TRIGGER] DB push successful');
      } catch (pushError: any) {
        logger.error('[MIGRATION-TRIGGER] DB push also failed', { error: pushError.message });
        results.errors.push(`Push failed: ${pushError.message}`);
      }
    }
    
    // Step 3: Generate client
    try {
      logger.info('[MIGRATION-TRIGGER] Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'pipe' });
      results.generate = true;
      logger.info('[MIGRATION-TRIGGER] Client generation successful');
    } catch (generateError: any) {
      logger.error('[MIGRATION-TRIGGER] Client generation failed', { error: generateError.message });
      results.errors.push(`Generate failed: ${generateError.message}`);
    }
    
    // Check if any step succeeded
    const hasSuccess = results.migrate || results.push || results.generate;
    
    if (hasSuccess) {
      res.json({
        success: true,
        message: 'Migration triggered successfully',
        data: results
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'All migration steps failed',
        data: results
      });
    }
    
  } catch (error: any) {
    logger.error('[MIGRATION-TRIGGER] Migration trigger failed', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to trigger migration',
      error: error.message
    });
  }
});

/**
 * POST /api/migration/reset
 * Reset database (DANGER - only for development)
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Database reset not allowed in production'
      });
    }
    
    logger.info('[MIGRATION-RESET] Database reset triggered');
    
    execSync('npx prisma migrate reset --force', { stdio: 'pipe' });
    
    res.json({
      success: true,
      message: 'Database reset completed'
    });
    
  } catch (error: any) {
    logger.error('[MIGRATION-RESET] Database reset failed', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to reset database',
      error: error.message
    });
  }
});

export default router;