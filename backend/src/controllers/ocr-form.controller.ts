import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FormType } from '../types/form-template';
import ocrService from '../services/ocr.service';
import formContentMatcherService from '../services/form-content-matcher.service';
import { uploadToStorage } from '../utils/storage';
import { ExtractedContent } from '../types/ocr';
import importService from '../services/import.service';
import exportService from '../services/export.service';
import returnService from '../services/return.service';
import wasteService from '../services/waste.service';
import ocrLearningService from '../services/ocr.learning.service';
import logger, { ocrLogger, formLogger, apiLogger } from '../services/logger.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

class OcrFormController {
  /**
   * Kiểm tra và tạo bảng OCRFormDraft nếu chưa tồn tại
   */
  private async ensureOCRFormDraftTable() {
    try {
      // Thử query để kiểm tra bảng có tồn tại không
      await prisma.$queryRaw`SELECT 1 FROM "OCRFormDraft" LIMIT 1`;
    } catch (error: any) {
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('Creating OCRFormDraft table...');
        try {
          // Tạo bảng OCRFormDraft
          await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "OCRFormDraft" (
              "id" TEXT NOT NULL,
              "type" TEXT NOT NULL,
              "fields" JSONB NOT NULL,
              "items" JSONB NOT NULL,
              "originalImage" TEXT,
              "status" TEXT NOT NULL DEFAULT 'pending',
              "createdBy" TEXT,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "OCRFormDraft_pkey" PRIMARY KEY ("id")
            );
          `;
          console.log('OCRFormDraft table created successfully');
        } catch (createError) {
          console.error('Failed to create OCRFormDraft table:', createError);
          throw createError;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Xử lý OCR và map vào form
   */
  public async processForm(req: Request, res: Response) {
    const startTime = Date.now();
    apiLogger.request(req);
    let draftId = '';
    try {
      logger.info('Bắt đầu xử lý OCR form', { userId: req.user?.id, formType: req.body.formType });
      // Đảm bảo bảng OCRFormDraft tồn tại
      await this.ensureOCRFormDraftTable();
      logger.info('Đã kiểm tra/tạo bảng OCRFormDraft');

      const formType = req.body.formType as FormType;
      const imageBuffer = req.file?.buffer;
      const userId = req.user && typeof req.user.id === 'string' ? req.user.id : (req.user && req.user.id ? String(req.user.id) : null);

      if (!imageBuffer) {
        logger.error('Không tìm thấy file ảnh', { userId, formType });
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy file ảnh'
        });
      }

      if (!formType) {
        logger.error('Thiếu loại form (formType)', { userId });
        return res.status(400).json({
          success: false,
          message: 'Thiếu loại form (formType)'
        });
      }

      // 1. Xử lý OCR
      const imageId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      ocrLogger.start(imageId, { userId, formType });
      let ocrResult;
      try {
        ocrResult = await ocrService.processReceipt(imageBuffer);
        ocrLogger.complete(imageId, ocrResult.processingTime, ocrResult.confidence);
        logger.info('Kết quả OCR', { imageId, ocrResult });
      } catch (ocrError) {
        const errorObj = ocrError instanceof Error ? ocrError : new Error(String(ocrError));
        ocrLogger.error(imageId, errorObj, { userId, formType });
        logger.error('Lỗi khi xử lý OCR', { error: errorObj, userId, formType });
        throw errorObj;
      }

      // 2. Map vào form
      let processedForm;
      try {
        processedForm = await formContentMatcherService.processOcrContent(
          ocrResult.contents as ExtractedContent[],
          formType
        );
        logger.info('Kết quả mapping OCR vào form', { processedForm });
      } catch (mapError) {
        const errorObj = mapError instanceof Error ? mapError : new Error(String(mapError));
        logger.error('Lỗi khi mapping OCR vào form', { error: errorObj, userId, formType });
        throw errorObj;
      }

      // 3. Upload ảnh gốc
      let imagePath: string | null = null;
      try {
        imagePath = await uploadToStorage(imageBuffer, 'ocr-forms');
        logger.info('Ảnh đã upload', { imagePath });
      } catch (uploadError) {
        const errorObj = uploadError instanceof Error ? uploadError : new Error(String(uploadError));
        logger.warn('Lỗi upload ảnh, tiếp tục không lưu ảnh', { error: errorObj });
      }

      // 4. Lưu form draft vào DB
      draftId = uuidv4();
      try {
        const draft = await prisma.oCRFormDraft.create({
          data: {
            id: draftId,
            type: formType,
            fields: JSON.stringify(processedForm.fields),
            items: JSON.stringify(processedForm.items),
            originalImage: imagePath,
            status: 'pending',
            createdBy: userId,
            updatedAt: new Date()
          }
        });
        formLogger.created(draftId, formType, { userId });
        logger.info('Đã lưu form draft vào DB', { draftId });
        apiLogger.response(req, res, Date.now() - startTime);
        return res.json({
          success: true,
          data: {
            formId: draft.id,
            ...processedForm,
            originalImage: imagePath
          }
        });
      } catch (dbError: any) {
        const errorObj = dbError instanceof Error ? dbError : new Error(String(dbError));
        formLogger.error(draftId, errorObj, { userId });
        logger.error('Lỗi khi lưu draft vào database', { error: errorObj, draftId });
        // Trả về kết quả OCR mà không lưu database
        apiLogger.response(req, res, Date.now() - startTime);
        return res.json({
          success: true,
          data: {
            formId: draftId,
            ...processedForm,
            originalImage: imagePath,
            warning: 'OCR processed successfully but could not save to database'
          }
        });
      }
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Lỗi tổng thể xử lý OCR form', { error: errorObj, userId: req.user?.id, formType: req.body.formType });
      apiLogger.error(req, errorObj);
      return res.status(500).json({
        success: false,
        message: errorObj.message || 'Lỗi khi xử lý form'
      });
    }
  }

  /**
   * Xác nhận kết quả OCR và form matching
   */
  public async confirmFormContent(req: Request, res: Response) {
    try {
      // Đảm bảo bảng OCRFormDraft tồn tại
      await this.ensureOCRFormDraftTable();

      const { formId, corrections } = req.body;
      const userId = req.user && typeof req.user.id === 'string' ? req.user.id : (req.user && req.user.id ? String(req.user.id) : null);

      if (!formId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu form ID'
        });
      }

      // 1. Lấy dữ liệu draft
      let draft;
      try {
        draft = await prisma.oCRFormDraft.findUnique({ where: { id: formId } });
      } catch (dbError) {
        console.error('Database error when fetching draft:', dbError);
        return res.status(500).json({ 
          success: false, 
          message: 'Lỗi database khi lấy thông tin form draft' 
        });
      }

      if (!draft) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy form draft' });
      }
      if (draft.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Form đã được xác nhận hoặc huỷ' });
      }

      // 2. Parse fields/items
      let fields: Array<{ name: string; value: any }> = typeof draft.fields === 'string' ? JSON.parse(draft.fields) : [];
      let items: Array<Record<string, any>> = typeof draft.items === 'string' ? JSON.parse(draft.items) : [];

      // 3. Áp corrections (nếu có)
      if (Array.isArray(corrections)) {
        corrections.forEach((corr: any) => {
          // Tìm và cập nhật field hoặc item tương ứng
          // Giả sử fieldId dạng 'field_name' hoặc 'item_{index}_field'
          if (corr.fieldId.startsWith('item_')) {
            // item_{index}_{field}
            const match = corr.fieldId.match(/^item_(\d+)_(.+)$/);
            if (match) {
              const idx = parseInt(match[1], 10);
              const key = match[2];
              if (items[idx]) items[idx][key] = corr.newValue;
            }
          } else {
            // field chung
            const field = fields.find((f: { name: string; value: any }) => f.name === corr.fieldId);
            if (field) field.value = corr.newValue;
          }
        });
      }

      // 4. Mapping sang nghiệp vụ thực tế
      let createdRecord = null;
      
      if (draft.type === 'IMPORT') {
        // Mapping fields/items sang ImportData
        let supplierId = fields.find(f => f.name === 'supplierId')?.value || null;
        if (supplierId && typeof supplierId === 'string') {
          // Tra cứu id từ tên
          const supplier = await prisma.supplier.findFirst({ where: { name: supplierId } });
          if (supplier) {
            supplierId = supplier.id;
          } else {
            return res.status(400).json({
              success: false,
              message: `Nhà cung cấp '${supplierId}' không tồn tại trong hệ thống. Vui lòng kiểm tra lại.`
            });
          }
        }
        const importData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          supplierId,
          invoiceNumber: fields.find(f => f.name === 'invoice_no')?.value || '',
          processedById: userId,
          totalAmount: fields.find(f => f.name === 'total')?.value || 0,
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: 'PENDING',
          attachments: draft.originalImage ? [draft.originalImage] : [],
          items: items.map((item: any) => ({
            itemId: item.itemId || null,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            expiryDate: item.expiryDate || null,
            batchNumber: item.batchNumber || null,
            notes: item.notes || ''
          }))
        };
        createdRecord = await importService.createImport(importData);
      }
      
      else if (draft.type === 'EXPORT') {
        // Mapping fields/items sang ExportData
        let departmentId = fields.find(f => f.name === 'department')?.value || null;
        if (departmentId && typeof departmentId === 'string') {
          const department = await prisma.department.findFirst({ where: { name: departmentId } });
          if (department) {
            departmentId = department.id;
          } else {
            return res.status(400).json({
              success: false,
              message: `Phòng ban '${departmentId}' không tồn tại trong hệ thống. Vui lòng kiểm tra lại.`
            });
          }
        }
        const exportData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          purpose: fields.find(f => f.name === 'purpose')?.value || 'GENERAL',
          departmentId,
          processedById: userId,
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: 'PENDING',
          attachments: draft.originalImage ? [draft.originalImage] : [],
          items: items.map((item: any) => ({
            itemId: item.itemId || null,
            quantity: item.quantity || 0,
            notes: item.notes || ''
          }))
        };
        createdRecord = await exportService.createExport(exportData);
      }
      
      else if (draft.type === 'RETURN') {
        // Mapping fields/items sang ReturnData
        let departmentId = fields.find(f => f.name === 'department')?.value || null;
        if (departmentId && typeof departmentId === 'string') {
          const department = await prisma.department.findFirst({ where: { name: departmentId } });
          if (department) {
            departmentId = department.id;
          } else {
            return res.status(400).json({
              success: false,
              message: `Phòng ban '${departmentId}' không tồn tại trong hệ thống. Vui lòng kiểm tra lại.`
            });
          }
        }
        const returnData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          reason: fields.find(f => f.name === 'reason')?.value || 'OTHER',
          departmentId,
          processedById: userId,
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: 'PENDING',
          attachments: draft.originalImage ? [draft.originalImage] : [],
          items: items.map((item: any) => ({
            itemId: item.itemId || null,
            quantity: item.quantity || 0,
            condition: item.condition || 'GOOD',
            originalExportId: item.originalExportId || null,
            notes: item.notes || ''
          }))
        };
        createdRecord = await returnService.createReturn(returnData);
      }
      
      else if (draft.type === 'ADJUSTMENT') {
        // Mapping fields/items sang WasteData (vì ADJUSTMENT thường là hao hụt/điều chỉnh)
        let departmentId = fields.find(f => f.name === 'department')?.value || null;
        if (departmentId && typeof departmentId === 'string') {
          const department = await prisma.department.findFirst({ where: { name: departmentId } });
          if (department) {
            departmentId = department.id;
          } else {
            return res.status(400).json({
              success: false,
              message: `Phòng ban '${departmentId}' không tồn tại trong hệ thống. Vui lòng kiểm tra lại.`
            });
          }
        }
        const wasteData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          wasteType: fields.find(f => f.name === 'reason')?.value || 'OTHER',
          departmentId,
          description: fields.find(f => f.name === 'notes')?.value || 'Điều chỉnh từ OCR',
          processedById: userId,
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: 'PENDING',
          evidencePhotos: draft.originalImage ? [draft.originalImage] : [],
          items: items.map((item: any) => ({
            itemId: item.itemId || null,
            quantity: item.quantity || 0,
            estimatedValue: item.estimatedValue || 0,
            reason: item.reason || 'Điều chỉnh từ OCR',
            notes: item.notes || ''
          }))
        };
        createdRecord = await wasteService.createWaste(wasteData);
      }

      // TODO: Thêm mapping cho WASTE, ADJUSTMENT...

      // 5. Cập nhật trạng thái draft
      try {
        await prisma.oCRFormDraft.update({
          where: { id: formId },
          data: { status: 'confirmed', updatedAt: new Date() }
        });
      } catch (dbError) {
        console.error('Database error when updating draft status:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi database khi cập nhật trạng thái form draft'
        });
      }

      // 6. Lưu corrections vào học máy
      if (Array.isArray(corrections)) {
        for (const corr of corrections) {
          await ocrLearningService.saveCorrection({
            originalText: corr.oldValue,
            correctedText: corr.newValue,
            type: corr.fieldId, // Có thể cần mapping sang loại (supplier, item, date...)
            confidence: corr.confidence || 1
          });
        }
      }

      return res.json({
        success: true,
        message: 'Đã xác nhận và lưu vào dữ liệu thực tế',
        data: createdRecord
      });
    } catch (error: any) {
      console.error('Error confirming form content:', error);
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