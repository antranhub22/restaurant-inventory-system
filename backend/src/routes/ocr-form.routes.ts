import { Router } from 'express';
import multer from 'multer';
import ocrFormController from '../controllers/ocr-form.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  validateRequest,
  processFormSchema,
  confirmFormSchema,
  getPendingFormsSchema
} from '../middleware/validation.middleware';
import { ocrRateLimit, apiRateLimit } from '../middleware/rate-limit.middleware';

const router: Router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware xác thực và rate limit cho tất cả routes
router.use(authMiddleware);
router.use(apiRateLimit);

// Route xử lý OCR và form matching
router.post(
  '/process',
  ocrRateLimit, // Rate limit riêng cho OCR
  upload.single('image'),
  validateRequest(processFormSchema),
  ocrFormController.processForm.bind(ocrFormController)
);

// Route xác nhận kết quả OCR
router.post(
  '/confirm',
  validateRequest(confirmFormSchema),
  ocrFormController.confirmFormContent.bind(ocrFormController)
);

// Route lấy danh sách forms đang chờ xử lý
router.get(
  '/pending',
  validateRequest(getPendingFormsSchema),
  ocrFormController.getPendingForms.bind(ocrFormController)
);

export default router; 