import { Request, Response } from 'express';
import { FormType } from '../types/form-template';
import ocrService from '../services/ocr.service';
import formContentMatcherService from '../services/form-content-matcher.service';
import { uploadToStorage } from '../utils/storage';
import { ExtractedContent } from '../types/ocr';

class OcrFormController {
  /**
   * Xử lý OCR và map vào form
   */
  public async processForm(req: Request, res: Response) {
    try {
      const formType = req.body.formType as FormType;
      const imageBuffer = req.file?.buffer;

      if (!imageBuffer) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy file ảnh'
        });
      }

      if (!formType) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu loại form (formType)'
        });
      }

      // 1. Xử lý OCR
      const ocrResult = await ocrService.processReceipt(imageBuffer);

      // 2. Map vào form
      const processedForm = await formContentMatcherService.processOcrContent(
        ocrResult.contents as ExtractedContent[],
        formType
      );

      // 3. Upload ảnh gốc
      const imagePath = await uploadToStorage(imageBuffer, 'ocr-forms');

      return res.json({
        success: true,
        data: {
          ...processedForm,
          originalImage: imagePath
        }
      });
    } catch (error: any) {
      console.error('Error processing form:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xử lý form'
      });
    }
  }

  /**
   * Xác nhận kết quả OCR và form matching
   */
  public async confirmFormContent(req: Request, res: Response) {
    try {
      const { formId, corrections } = req.body;

      if (!formId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu form ID'
        });
      }

      // TODO: Implement form confirmation logic
      // 1. Cập nhật form với corrections
      // 2. Lưu corrections vào learning database
      // 3. Cập nhật trạng thái form

      return res.json({
        success: true,
        message: 'Đã xác nhận nội dung form'
      });
    } catch (error: any) {
      console.error('Error confirming form:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi xác nhận form'
      });
    }
  }

  /**
   * Lấy danh sách forms đang chờ xử lý
   */
  public async getPendingForms(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;

      // TODO: Implement get pending forms logic
      // 1. Lấy danh sách forms cần review
      // 2. Phân trang
      // 3. Thêm thông tin liên quan

      return res.json({
        success: true,
        data: {
          forms: [],
          pagination: {
            page,
            limit,
            total: 0
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting pending forms:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy danh sách forms'
      });
    }
  }
}

export default new OcrFormController(); 