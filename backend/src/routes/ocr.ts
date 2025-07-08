import express, { Request, Response } from 'express';
import multer from 'multer';
import ocrService from '../services/ocr.service';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Configure multer for handling file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Process receipt image
router.post(
  '/process-receipt',
  authenticate,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Không tìm thấy file ảnh' });
      }

      const result = await ocrService.processReceipt(req.file.buffer);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('OCR processing error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi khi xử lý OCR' 
      });
    }
  }
);

export default router; 