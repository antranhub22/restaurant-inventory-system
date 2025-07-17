import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import ocrController from '../controllers/ocr.controller';

const router: Router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.use(authMiddleware);

router.post('/process-receipt', upload.single('image'), ocrController.processImage);
router.get('/history', ocrController.getHistory);

export default router; 