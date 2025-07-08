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

const prisma = new PrismaClient();

class OcrFormController {
  /**
   * Xử lý OCR và map vào form
   */
  public async processForm(req: Request, res: Response) {
    try {
      const formType = req.body.formType as FormType;
      const imageBuffer = req.file?.buffer;
      const userId = req.user && typeof req.user.id === 'string' ? req.user.id : (req.user && req.user.id ? String(req.user.id) : null);

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

      // 4. Lưu form draft vào DB
      const draft = await prisma.oCRFormDraft.create({
        data: {
          type: formType,
          fields: JSON.stringify(processedForm.fields),
          items: JSON.stringify(processedForm.items),
          originalImage: imagePath,
          status: 'pending',
          createdBy: userId
        }
      });

      return res.json({
        success: true,
        data: {
          formId: draft.id,
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
      const userId = req.user && typeof req.user.id === 'string' ? req.user.id : (req.user && req.user.id ? String(req.user.id) : null);

      if (!formId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu form ID'
        });
      }

      // 1. Lấy dữ liệu draft
      const draft = await prisma.oCRFormDraft.findUnique({ where: { id: formId } });
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
        const importData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          supplierId: fields.find(f => f.name === 'supplierId')?.value || null,
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
        const exportData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          purpose: fields.find(f => f.name === 'purpose')?.value || 'GENERAL',
          departmentId: fields.find(f => f.name === 'department')?.value || null,
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
        const returnData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          reason: fields.find(f => f.name === 'reason')?.value || 'OTHER',
          departmentId: fields.find(f => f.name === 'department')?.value || null,
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
        const wasteData: any = {
          date: fields.find(f => f.name === 'date')?.value || new Date(),
          wasteType: fields.find(f => f.name === 'reason')?.value || 'OTHER',
          departmentId: fields.find(f => f.name === 'department')?.value || null,
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
      await prisma.oCRFormDraft.update({
        where: { id: formId },
        data: { status: 'confirmed', updatedAt: new Date() }
      });

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