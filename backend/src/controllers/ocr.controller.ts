import { Request, Response } from 'express';
import ocrService from '../services/ocr.service';

class OcrController {
  async processImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy file ảnh'
        });
      }

      const result = await ocrService.processReceipt(req.file.buffer);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error processing image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xử lý ảnh'
      });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      // TODO: Implement OCR history
      res.json({
        success: true,
        data: {
          history: []
        }
      });
    } catch (error: any) {
      console.error('Error getting history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy lịch sử'
      });
    }
  }
}

export default new OcrController(); 