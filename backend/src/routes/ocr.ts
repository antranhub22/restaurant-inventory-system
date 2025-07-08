import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import ocrController from '../controllers/ocr.controller';

const router = Router();

router.use(authMiddleware);

router.post('/process', ocrController.processImage);
router.get('/history', ocrController.getHistory);

export default router; 