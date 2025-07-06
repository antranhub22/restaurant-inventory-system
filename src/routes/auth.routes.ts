import { Router } from 'express';
import { loginController, refreshController, logoutController, meController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.get('/me', authMiddleware, meController);

export default router; 