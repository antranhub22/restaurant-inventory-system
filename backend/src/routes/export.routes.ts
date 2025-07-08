import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import exportController from '../controllers/export.controller';

const router = Router();

router.post('/',
  authenticate,
  authorize([Role.manager, Role.owner]),
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
  authorize([Role.owner]),
  exportController.approveExport
);

router.post('/:id/reject',
  authenticate,
  authorize([Role.owner, Role.manager]),
  exportController.rejectExport
);

export default router; 