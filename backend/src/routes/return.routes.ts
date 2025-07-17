import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import returnController from '../controllers/return.controller';

const router: Router = Router();

router.use(authMiddleware);

router.post('/', returnController.createReturn);
router.get('/', returnController.getReturns);
router.get('/pending', returnController.getPendingReturns);
router.get('/:id', returnController.getReturnById);
router.put('/:id', returnController.updateReturn);
router.delete('/:id', returnController.deleteReturn);

// Approval routes
router.post('/:id/approve', returnController.approveReturn);
router.post('/:id/reject', returnController.rejectReturn);

export default router; 