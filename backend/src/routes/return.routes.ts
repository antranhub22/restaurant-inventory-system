import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import returnController from '../controllers/return.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', returnController.createReturn);
router.get('/', returnController.getReturns);
router.get('/:id', returnController.getReturnById);
router.put('/:id', returnController.updateReturn);
router.delete('/:id', returnController.deleteReturn);

export default router; 