import express from 'express';
import returnController from '../controllers/return.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Routes
router.post('/',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER, Role.SUPERVISOR),
  returnController.createReturn
);

router.get('/',
  authenticate,
  returnController.getReturns
);

router.get('/:id',
  authenticate,
  returnController.getReturnById
);

router.post('/:id/approve',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  returnController.approveReturn
);

router.post('/:id/reject',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  returnController.rejectReturn
);

export default router; 