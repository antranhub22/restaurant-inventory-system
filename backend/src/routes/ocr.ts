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
router.post('/process-receipt', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  try {
    console.log('\n📥 Nhận request xử lý OCR...');
    
    if (!req.file) {
      console.error('❌ Không tìm thấy file trong request');
      return res.status(400).json({ error: 'Không tìm thấy file ảnh' });
    }

    console.log('📊 Thông tin file:');
    console.log('- Tên file:', req.file.originalname);
    console.log('- Loại file:', req.file.mimetype);
    console.log('- Kích thước:', req.file.size, 'bytes');

    console.log('\n⚙️ Bắt đầu xử lý OCR...');
    const result = await ocrService.processReceipt(req.file.buffer);
    
    console.log('\n✅ Xử lý OCR thành công');
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('\n❌ Lỗi khi xử lý OCR:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi khi xử lý OCR' 
    });
  }
});

export default router; 