import express from 'express';
import exportController from '../controllers/export.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Routes
router.post('/',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER, Role.SUPERVISOR),
  exportController.createExport
);

router.get('/',
  authenticate,
  exportController.getExports
);

router.get('/:id',
  authenticate,
  exportController.getExportById
);

router.post('/:id/approve',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  exportController.approveExport
);

router.post('/:id/reject',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  exportController.rejectExport
);

export default router; 