import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FormType } from '../types/form-template';
import { ImportStatus } from '../types/import';
import { ExportPurpose, ExportStatus } from '../types/export';
import { ReturnReason, ReturnStatus, ItemCondition } from '../types/return';
import { WasteType, WasteStatus } from '../types/waste';
import ocrService from '../services/ocr.service';
import formContentMatcherService from '../services/form-content-matcher.service';
import aiFormMapperService from '../services/ai-form-mapper.service';
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
      logger.info('[DEBUG] Bắt đầu xử lý OCR form', { userId: // @ts-ignore
 req.user?.id, formType: req.body.formType });
      // Đảm bảo bảng OCRFormDraft tồn tại
      await this.ensureOCRFormDraftTable();
      logger.info('[DEBUG] Đã kiểm tra/tạo bảng OCRFormDraft');

      const formType = req.body.formType as FormType;
      const imageBuffer = req.file?.buffer;
      const userId = // @ts-ignore
 req.user && typeof // @ts-ignore
 req.user.id === 'string' ? // @ts-ignore
 req.user.id : (req.user && // @ts-ignore
 req.user.id ? String(req.user.id) : null);

      logger.info('[DEBUG] Input nhận được', { 
        formType, 
        hasImage: !!imageBuffer, 
        imageSize: imageBuffer?.length,
        userId 
      });

      if (!imageBuffer) {
        logger.error('[DEBUG] Không tìm thấy file ảnh', { userId, formType });
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy file ảnh'
        });
      }

      if (!formType) {
        logger.error('[DEBUG] Thiếu loại form (formType)', { userId });
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
        logger.info('[DEBUG] Bắt đầu gọi ocrService.processReceipt');
        ocrResult = await ocrService.processReceipt(imageBuffer);
        logger.info('[DEBUG] Kết quả trả về từ ocrService.processReceipt', { 
          contentsLength: ocrResult.contents?.length,
          confidence: ocrResult.confidence,
          processingTime: ocrResult.processingTime
        });
        ocrLogger.complete(imageId, ocrResult.processingTime, ocrResult.confidence);
        logger.info('Kết quả OCR', { 
          imageId, 
          contentsLength: ocrResult.contents?.length,
          confidence: ocrResult.confidence
        });
      } catch (ocrError) {
        const errorObj = ocrError instanceof Error ? ocrError : new Error(String(ocrError));
        ocrLogger.error(imageId, errorObj, { userId, formType });
        logger.error('[DEBUG] Lỗi khi xử lý OCR', { error: errorObj, userId, formType });
        throw errorObj;
      }

      // 2. Map vào form bằng AI
      let processedForm;
      try {
        // Kiểm tra xem có AI provider không
        if (aiFormMapperService.hasProvider()) {
          logger.info('[DEBUG] Bắt đầu mapping OCR vào form với AI (aiFormMapperService.processOcrContent)', { contentsLength: ocrResult.contents?.length, formType });
          processedForm = await aiFormMapperService.processOcrContent(
            ocrResult.contents as ExtractedContent[],
            formType
          );
          logger.info('[DEBUG] Kết quả mapping OCR vào form bằng AI', { 
            fieldsCount: processedForm?.fields?.length,
            itemsCount: processedForm?.items?.length 
          });
        } else {
          // Fallback về phương pháp cũ nếu không có AI
          logger.info('[DEBUG] Không có AI provider, fallback về formContentMatcherService.processOcrContent', { contentsLength: ocrResult.contents?.length, formType });
          processedForm = await formContentMatcherService.processOcrContent(
            ocrResult.contents as ExtractedContent[],
            formType
          );
          logger.info('[DEBUG] Kết quả mapping OCR vào form bằng phương pháp cũ', { 
            fieldsCount: processedForm?.fields?.length,
            itemsCount: processedForm?.items?.length 
          });
        }
      } catch (mapError) {
        const errorObj = mapError instanceof Error ? mapError : new Error(String(mapError));
        logger.error('[DEBUG] Lỗi khi mapping OCR vào form', { error: errorObj, userId, formType });
        throw errorObj;
      }

      // 3. Upload ảnh gốc
      let imagePath: string | null = null;
      try {
        logger.info('[DEBUG] Bắt đầu upload ảnh gốc');
        imagePath = await uploadToStorage(imageBuffer, 'ocr-forms');
        logger.info('[DEBUG] Ảnh đã upload', { imagePath });
      } catch (uploadError) {
        const errorObj = uploadError instanceof Error ? uploadError : new Error(String(uploadError));
        logger.warn('[DEBUG] Lỗi upload ảnh, tiếp tục không lưu ảnh', { error: errorObj });
      }

      // 4. Lưu form draft vào DB
      draftId = uuidv4();
      try {
        logger.info('[DEBUG] Bắt đầu lưu form draft vào DB', { 
          draftId, 
          fieldsCount: processedForm?.fields?.length,
          itemsCount: processedForm?.items?.length
        });
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
        logger.info('[DEBUG] Đã lưu form draft vào DB', { draftId });
        apiLogger.response(req, res, Date.now() - startTime);
        logger.info('[DEBUG] Tổng thời gian xử lý processForm', { ms: Date.now() - startTime });
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
        logger.error('[DEBUG] Lỗi khi lưu draft vào database', { error: errorObj, draftId });
        // Trả về kết quả OCR mà không lưu database
        apiLogger.response(req, res, Date.now() - startTime);
        logger.info('[DEBUG] Tổng thời gian xử lý processForm (lỗi lưu DB)', { ms: Date.now() - startTime });
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
      logger.error('[DEBUG] Lỗi tổng thể xử lý OCR form', { error: errorObj, userId: // @ts-ignore
 req.user?.id, formType: req.body.formType });
      apiLogger.error(req, errorObj);
      logger.info('[DEBUG] Tổng thời gian xử lý processForm (lỗi tổng thể)', { ms: Date.now() - startTime });
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
      logger.info('[DEBUG] confirmFormContent - Start', { 
        formId: req.body?.formId,
        // @ts-ignore
        hasUser: !!req.user,
        userId: // @ts-ignore
 req.user?.id 
      });

      // Đảm bảo bảng OCRFormDraft tồn tại
      await this.ensureOCRFormDraftTable();

      const { formId, corrections } = req.body;
      
      // Get userId directly from authenticated user
      const userId = // @ts-ignore
 req.user?.id;
      
      if (!userId) {
        logger.error('[DEBUG] confirmFormContent - Missing userId');
        return res.status(401).json({
          success: false,
          message: 'Yêu cầu đăng nhập để thực hiện chức năng này'
        });
      }
      
      logger.info('[DEBUG] confirmFormContent - Parsed data', { 
        formId, 
        userId, 
        hasCorrections: !!corrections, 
        correctionsLength: corrections?.length 
      });

      if (!formId) {
        logger.error('[DEBUG] confirmFormContent - Missing formId');
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
        logger.info('[DEBUG] confirmFormContent - Processing IMPORT type');
        
        // Mapping fields/items sang ImportData
        let supplierId = fields.find(f => f.name === 'supplierId')?.value || fields.find(f => f.name === 'supplier')?.value || null;
        
        logger.info('[DEBUG] confirmFormContent - Original supplierId', { supplierId, fields: fields.map(f => ({ name: f.name, value: f.value })) });
        
        // PRE-PROCESS: Auto-create supplier trước khi tạo import
        if (supplierId && typeof supplierId === 'string') {
          // Tra cứu supplier từ tên
          let supplier = await prisma.supplier.findFirst({ where: { name: supplierId } });
          
          if (supplier) {
            supplierId = supplier.id;
            logger.info('[DEBUG] confirmFormContent - Found existing supplier', { supplierId, supplierName: supplier.name });
          } else {
            // Tự động tạo supplier mới nếu chưa tồn tại
            logger.info('[DEBUG] confirmFormContent - Creating new supplier', { supplierName: supplierId });
            try {
              supplier = await prisma.supplier.create({
                data: {
                  name: supplierId,
                  contactPerson: 'Chưa cập nhật',
                  phone: '',
                  address: 'Chưa cập nhật',
                  isActive: true
                }
              });
              supplierId = supplier.id;
              logger.info('[DEBUG] confirmFormContent - Created new supplier successfully', { 
                supplierId: supplier.id, 
                supplierName: supplier.name 
              });
            } catch (createError) {
              logger.error('[DEBUG] confirmFormContent - Failed to create supplier', { 
                error: createError, 
                supplierName: supplierId 
              });
              return res.status(500).json({
                success: false,
                message: `Lỗi khi tạo nhà cung cấp mới: ${supplierId}`
              });
            }
          }
        }
        
        // Convert to number if it's a string number
        if (typeof supplierId === 'string' && !isNaN(Number(supplierId))) {
          supplierId = Number(supplierId);
        }
        
        // If still no valid supplierId, return error
        if (!supplierId || isNaN(Number(supplierId))) {
          logger.error('[DEBUG] confirmFormContent - No valid supplierId after processing');
          return res.status(400).json({
            success: false,
            message: 'Không thể xác định nhà cung cấp từ dữ liệu OCR'
          });
        }

        // PRE-PROCESS: Process items - auto-create if not exist BEFORE main transaction
        const processedItems = [];
        for (const item of items) {
          let itemId = item.itemId;
          
          // If no itemId, try to find by name
          if (!itemId && item.name) {
            const existingItem = await prisma.item.findFirst({
              where: { name: { contains: item.name, mode: 'insensitive' } }
            });
            
            if (existingItem) {
              itemId = existingItem.id;
              logger.info('[DEBUG] confirmFormContent - Found existing item', { 
                itemId, 
                itemName: existingItem.name 
              });
            } else {
              // Auto-create new item
              logger.info('[DEBUG] confirmFormContent - Creating new item', { itemName: item.name });
              try {
                // Get default category (first available)
                const defaultCategory = await prisma.category.findFirst({ where: { isActive: true } });
                if (!defaultCategory) {
                  throw new Error('No active category found for new item');
                }
                
                const newItem = await prisma.item.create({
                  data: {
                    name: item.name,
                    categoryId: defaultCategory.id,
                    unit: item.unit || 'kg',
                    unitCost: item.unitPrice || 0,
                    description: 'Tự động tạo từ OCR',
                    isActive: true
                  }
                });
                itemId = newItem.id;
                logger.info('[DEBUG] confirmFormContent - Created new item successfully', { 
                  itemId: newItem.id, 
                  itemName: newItem.name 
                });
              } catch (createError) {
                logger.error('[DEBUG] confirmFormContent - Failed to create item', { 
                  error: createError, 
                  itemName: item.name 
                });
                // Continue without this item rather than failing the whole import
                continue;
              }
            }
          }
          
          // Only add items with valid itemId
          if (itemId && !isNaN(Number(itemId))) {
            // Lấy giá từ database nếu OCR không nhận diện được
            let unitPrice = Number(item.unitPrice) || 0;
            if (unitPrice === 0) {
              try {
                const dbItem = await prisma.item.findUnique({
                  where: { id: Number(itemId) }
                });
                if (dbItem && dbItem.unitCost && dbItem.unitCost > 0) {
                  unitPrice = Number(dbItem.unitCost);
                  logger.info('[DEBUG] confirmFormContent - Using default unitPrice from database', { 
                    itemId, 
                    defaultPrice: unitPrice 
                  });
                }
              } catch (error) {
                logger.warn('[DEBUG] confirmFormContent - Failed to get default price', { 
                  itemId, 
                  error 
                });
              }
            }

            processedItems.push({
              itemId: Number(itemId),
              quantity: Number(item.quantity) || 0,
              unitPrice: unitPrice,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              batchNumber: item.batchNumber || null,
              notes: item.notes || ''
            });
          } else {
            logger.warn('[DEBUG] confirmFormContent - Skipping item with invalid itemId', { 
              itemId, 
              itemName: item.name 
            });
          }
        }

        // Kiểm tra có items hợp lệ không
        if (processedItems.length === 0) {
          logger.error('[DEBUG] confirmFormContent - No valid items to import');
          return res.status(400).json({
            success: false,
            message: 'Không có sản phẩm hợp lệ để nhập kho'
          });
        }
        
        const dateValue = fields.find(f => f.name === 'date')?.value;
        const totalValue = fields.find(f => f.name === 'total')?.value;
        let invoiceNumber = fields.find(f => f.name === 'invoice_no')?.value || '';
        
        // Generate unique invoice number if missing or to avoid duplicates
        if (!invoiceNumber || invoiceNumber.trim() === '') {
          const timestamp = Date.now();
          invoiceNumber = `OCR-${timestamp}`;
        } else {
          // Check if invoice number already exists
          const existingImport = await prisma.import.findFirst({
            where: { invoiceNumber: invoiceNumber }
          });
          
          if (existingImport) {
            // Add timestamp to make it unique
            const timestamp = Date.now();
            invoiceNumber = `${invoiceNumber}-${timestamp}`;
            logger.info('[DEBUG] confirmFormContent - Modified duplicate invoice number', { 
              originalInvoice: fields.find(f => f.name === 'invoice_no')?.value,
              newInvoice: invoiceNumber
            });
          }
        }
        
        const importData: any = {
          date: dateValue ? new Date(dateValue) : new Date(),
          supplierId: Number(supplierId),
          invoiceNumber: invoiceNumber,
          processedById: userId,
          totalAmount: Number(totalValue) || 0,
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: ImportStatus.PENDING,
          attachments: draft.originalImage ? [draft.originalImage] : [],
          items: processedItems
        };
        
        logger.info('[DEBUG] confirmFormContent - Calling importService.createImport', { 
          supplierId: importData.supplierId,
          itemsCount: importData.items.length,
          totalAmount: importData.totalAmount
        });
        try {
          createdRecord = await importService.createImport(importData);
          logger.info('[DEBUG] confirmFormContent - Import created successfully', { 
            importId: createdRecord.id,
            itemsCount: createdRecord.items?.length
          });
        } catch (importError: any) {
          logger.error('[DEBUG] confirmFormContent - Error creating import', { 
            error: importError.message,
            stack: importError.stack,
            supplierId: importData.supplierId,
            itemsCount: importData.items.length
          });
          return res.status(500).json({
            success: false,
            message: `Lỗi khi tạo phiếu nhập: ${importError.message || 'Unknown error'}`
          });
        }
      }
      
      else if (draft.type === 'EXPORT') {
        logger.info('[DEBUG] confirmFormContent - Processing EXPORT type');
        
        // Mapping fields/items sang ExportData
        let departmentId = fields.find(f => f.name === 'department')?.value || null;
        if (departmentId && typeof departmentId === 'string') {
          // Tra cứu department từ tên
          let department = await prisma.department.findFirst({ where: { name: departmentId } });
          
          if (department) {
            departmentId = department.id;
            logger.info('[DEBUG] confirmFormContent - Found existing department', { departmentId, departmentName: department.name });
          } else {
            // Tự động tạo department mới nếu chưa tồn tại
            logger.info('[DEBUG] confirmFormContent - Creating new department', { departmentName: departmentId });
            try {
              // Generate unique code for department
              let deptCode = departmentId.replace(/\s+/g, '_').toUpperCase();
              const existingCode = await prisma.department.findFirst({ where: { code: deptCode } });
              if (existingCode) {
                deptCode = `${deptCode}_${Date.now()}`;
              }
              
              department = await prisma.department.create({
                data: {
                  name: departmentId,
                  code: deptCode,
                  description: 'Tự động tạo từ OCR',
                  isActive: true
                }
              });
              departmentId = department.id;
              logger.info('[DEBUG] confirmFormContent - Created new department successfully', { 
                departmentId: department.id, 
                departmentName: department.name 
              });
            } catch (createError) {
              logger.error('[DEBUG] confirmFormContent - Failed to create department', { 
                error: createError, 
                departmentName: departmentId 
              });
              return res.status(500).json({
                success: false,
                message: `Lỗi khi tạo phòng ban mới: ${departmentId}`
              });
            }
          }
        }

        // Process items - auto-find and auto-create items if needed
        const processedItems = [];
        for (const item of items) {
          let itemId = item.itemId;
          
          // If no itemId, try to find by name
          if (!itemId && item.name) {
            const existingItem = await prisma.item.findFirst({
              where: { name: { contains: item.name, mode: 'insensitive' } }
            });
            
            if (existingItem) {
              itemId = existingItem.id;
              logger.info('[DEBUG] confirmFormContent - Found existing item for export', { 
                itemId, 
                itemName: existingItem.name 
              });
            } else {
              // Auto-create new item
              logger.info('[DEBUG] confirmFormContent - Creating new item for export', { itemName: item.name });
              try {
                // Get default category (first available)
                const defaultCategory = await prisma.category.findFirst({ where: { isActive: true } });
                if (!defaultCategory) {
                  throw new Error('No active category found for new item');
                }
                
                const newItem = await prisma.item.create({
                  data: {
                    name: item.name,
                    categoryId: defaultCategory.id,
                    unit: item.unit || 'kg',
                    unitCost: Number(item.unitPrice) || 0,
                    description: 'Tự động tạo từ OCR Export',
                    isActive: true
                  }
                });
                itemId = newItem.id;
                logger.info('[DEBUG] confirmFormContent - Created new item successfully for export', { 
                  itemId: newItem.id, 
                  itemName: newItem.name 
                });
              } catch (createError) {
                logger.error('[DEBUG] confirmFormContent - Failed to create item for export', { 
                  error: createError, 
                  itemName: item.name 
                });
                // Continue without this item rather than failing the whole export
                continue;
              }
            }
          }
          
          // Only add items with valid itemId
          if (itemId && !isNaN(Number(itemId))) {
            processedItems.push({
              itemId: Number(itemId),
              quantity: Number(item.quantity) || 0,
              notes: item.notes || ''
            });
          } else {
            logger.warn('[DEBUG] confirmFormContent - Skipping export item with invalid itemId', { 
              itemId, 
              itemName: item.name 
            });
          }
        }

        // Check if we have valid items
        if (processedItems.length === 0) {
          logger.error('[DEBUG] confirmFormContent - No valid items to export');
          return res.status(400).json({
            success: false,
            message: 'Không có sản phẩm hợp lệ để xuất kho'
          });
        }

        const exportData: any = {
          date: fields.find(f => f.name === 'date')?.value ? new Date(fields.find(f => f.name === 'date')?.value) : new Date(),
          purpose: ExportPurpose.PRODUCTION, // Default to production, could be mapped from OCR
          departmentId: Number(departmentId),
          processedById: userId,
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: ExportStatus.PENDING,
          attachments: draft.originalImage ? [draft.originalImage] : [],
          items: processedItems
        };
        
        logger.info('[DEBUG] confirmFormContent - Calling exportService.createExport', { 
          departmentId: exportData.departmentId,
          itemsCount: exportData.items.length,
          purpose: exportData.purpose
        });
        
        try {
          createdRecord = await exportService.createExport(exportData);
          logger.info('[DEBUG] confirmFormContent - Export created successfully', { 
            exportId: createdRecord.id,
            itemsCount: createdRecord.items?.length
          });
        } catch (exportError: any) {
          logger.error('[DEBUG] confirmFormContent - Error creating export', { 
            error: exportError.message,
            departmentId: exportData.departmentId,
            itemsCount: exportData.items.length
          });
          return res.status(500).json({
            success: false,
            message: `Lỗi khi tạo phiếu xuất: ${exportError.message || 'Unknown error'}`
          });
        }
      }
      
      else if (draft.type === 'RETURN') {
        logger.info('[DEBUG] confirmFormContent - Processing RETURN type');
        
        // Mapping fields/items sang ReturnData
        let departmentId = fields.find(f => f.name === 'department')?.value || null;
        if (departmentId && typeof departmentId === 'string') {
          // Tra cứu department từ tên
          let department = await prisma.department.findFirst({ where: { name: departmentId } });
          
          if (department) {
            departmentId = department.id;
            logger.info('[DEBUG] confirmFormContent - Found existing department', { departmentId, departmentName: department.name });
          } else {
            // Tự động tạo department mới nếu chưa tồn tại
            logger.info('[DEBUG] confirmFormContent - Creating new department', { departmentName: departmentId });
            try {
              // Generate unique code for department
              let deptCode = departmentId.replace(/\s+/g, '_').toUpperCase();
              const existingCode = await prisma.department.findFirst({ where: { code: deptCode } });
              if (existingCode) {
                deptCode = `${deptCode}_${Date.now()}`;
              }
              
              department = await prisma.department.create({
                data: {
                  name: departmentId,
                  code: deptCode,
                  description: 'Tự động tạo từ OCR',
                  isActive: true
                }
              });
              departmentId = department.id;
              logger.info('[DEBUG] confirmFormContent - Created new department successfully', { 
                departmentId: department.id, 
                departmentName: department.name 
              });
            } catch (createError) {
              logger.error('[DEBUG] confirmFormContent - Failed to create department', { 
                error: createError, 
                departmentName: departmentId 
              });
              return res.status(500).json({
                success: false,
                message: `Lỗi khi tạo phòng ban mới: ${departmentId}`
              });
            }
          }
        }

        // Process items - auto-find and auto-create items if needed
        const processedItems = [];
        for (const item of items) {
          let itemId = item.itemId;
          
          // If no itemId, try to find by name
          if (!itemId && item.name) {
            const existingItem = await prisma.item.findFirst({
              where: { name: { contains: item.name, mode: 'insensitive' } }
            });
            
            if (existingItem) {
              itemId = existingItem.id;
              logger.info('[DEBUG] confirmFormContent - Found existing item for return', { 
                itemId, 
                itemName: existingItem.name 
              });
            } else {
              // Auto-create new item
              logger.info('[DEBUG] confirmFormContent - Creating new item for return', { itemName: item.name });
              try {
                // Get default category (first available)
                const defaultCategory = await prisma.category.findFirst({ where: { isActive: true } });
                if (!defaultCategory) {
                  throw new Error('No active category found for new item');
                }
                
                const newItem = await prisma.item.create({
                  data: {
                    name: item.name,
                    categoryId: defaultCategory.id,
                    unit: item.unit || 'kg',
                    unitCost: Number(item.unitPrice) || 0,
                    description: 'Tự động tạo từ OCR Return',
                    isActive: true
                  }
                });
                itemId = newItem.id;
                logger.info('[DEBUG] confirmFormContent - Created new item successfully for return', { 
                  itemId: newItem.id, 
                  itemName: newItem.name 
                });
              } catch (createError) {
                logger.error('[DEBUG] confirmFormContent - Failed to create item for return', { 
                  error: createError, 
                  itemName: item.name 
                });
                // Continue without this item rather than failing the whole return
                continue;
              }
            }
          }
          
          // Only add items with valid itemId
          if (itemId && !isNaN(Number(itemId))) {
            processedItems.push({
              itemId: Number(itemId),
              quantity: Number(item.quantity) || 0,
              condition: ItemCondition.GOOD, // Default to good condition
              originalExportId: item.originalExportId ? Number(item.originalExportId) : null,
              notes: item.notes || ''
            });
          } else {
            logger.warn('[DEBUG] confirmFormContent - Skipping return item with invalid itemId', { 
              itemId, 
              itemName: item.name 
            });
          }
        }

        // Check if we have valid items
        if (processedItems.length === 0) {
          logger.error('[DEBUG] confirmFormContent - No valid items to return');
          return res.status(400).json({
            success: false,
            message: 'Không có sản phẩm hợp lệ để hoàn trả'
          });
        }

        const returnData: any = {
          date: fields.find(f => f.name === 'date')?.value ? new Date(fields.find(f => f.name === 'date')?.value) : new Date(),
          reason: ReturnReason.OTHER,
          departmentId: Number(departmentId),
          processedById: userId,
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: ReturnStatus.PENDING,
          attachments: draft.originalImage ? [draft.originalImage] : [],
          items: processedItems
        };
        
        logger.info('[DEBUG] confirmFormContent - Calling returnService.createReturn', { 
          departmentId: returnData.departmentId,
          itemsCount: returnData.items.length,
          reason: returnData.reason
        });
        
        try {
          createdRecord = await returnService.createReturn(returnData);
          logger.info('[DEBUG] confirmFormContent - Return created successfully', { 
            returnId: createdRecord.id,
            itemsCount: createdRecord.items?.length
          });
        } catch (returnError: any) {
          logger.error('[DEBUG] confirmFormContent - Error creating return', { 
            error: returnError.message,
            departmentId: returnData.departmentId,
            itemsCount: returnData.items.length
          });
          return res.status(500).json({
            success: false,
            message: `Lỗi khi tạo phiếu hoàn trả: ${returnError.message || 'Unknown error'}`
          });
        }
      }
      
      else if (draft.type === 'ADJUSTMENT') {
        logger.info('[DEBUG] confirmFormContent - Processing ADJUSTMENT type');
        
        // Mapping fields/items sang WasteData (vì ADJUSTMENT thường là hao hụt/điều chỉnh)
        let departmentId = fields.find(f => f.name === 'department')?.value || null;
        if (departmentId && typeof departmentId === 'string') {
          // Tra cứu department từ tên
          let department = await prisma.department.findFirst({ where: { name: departmentId } });
          
          if (department) {
            departmentId = department.id;
            logger.info('[DEBUG] confirmFormContent - Found existing department', { departmentId, departmentName: department.name });
          } else {
            // Tự động tạo department mới nếu chưa tồn tại
            logger.info('[DEBUG] confirmFormContent - Creating new department', { departmentName: departmentId });
            try {
              // Generate unique code for department
              let deptCode = departmentId.replace(/\s+/g, '_').toUpperCase();
              const existingCode = await prisma.department.findFirst({ where: { code: deptCode } });
              if (existingCode) {
                deptCode = `${deptCode}_${Date.now()}`;
              }
              
              department = await prisma.department.create({
                data: {
                  name: departmentId,
                  code: deptCode,
                  description: 'Tự động tạo từ OCR',
                  isActive: true
                }
              });
              departmentId = department.id;
              logger.info('[DEBUG] confirmFormContent - Created new department successfully', { 
                departmentId: department.id, 
                departmentName: department.name 
              });
            } catch (createError) {
              logger.error('[DEBUG] confirmFormContent - Failed to create department', { 
                error: createError, 
                departmentName: departmentId 
              });
              return res.status(500).json({
                success: false,
                message: `Lỗi khi tạo phòng ban mới: ${departmentId}`
              });
            }
          }
        }

        // Process items - auto-find items by name if no itemId
        const processedItems = [];
        for (const item of items) {
          let itemId = item.itemId;
          
          // If no itemId, try to find by name
          if (!itemId && item.name) {
            const existingItem = await prisma.item.findFirst({
              where: { name: { contains: item.name, mode: 'insensitive' } }
            });
            
            if (existingItem) {
              itemId = existingItem.id;
              logger.info('[DEBUG] confirmFormContent - Found existing item for waste', { 
                itemId, 
                itemName: existingItem.name 
              });
            } else {
              // Auto-create new item
              logger.info('[DEBUG] confirmFormContent - Creating new item for waste', { itemName: item.name });
              try {
                // Get default category (first available)
                const defaultCategory = await prisma.category.findFirst({ where: { isActive: true } });
                if (!defaultCategory) {
                  throw new Error('No active category found for new item');
                }
                
                const newItem = await prisma.item.create({
                  data: {
                    name: item.name,
                    categoryId: defaultCategory.id,
                    unit: item.unit || 'kg',
                    unitCost: Number(item.unitPrice) || 0,
                    description: 'Tự động tạo từ OCR Waste',
                    isActive: true
                  }
                });
                itemId = newItem.id;
                logger.info('[DEBUG] confirmFormContent - Created new item successfully for waste', { 
                  itemId: newItem.id, 
                  itemName: newItem.name 
                });
              } catch (createError) {
                logger.error('[DEBUG] confirmFormContent - Failed to create item for waste', { 
                  error: createError, 
                  itemName: item.name 
                });
                // Continue without this item rather than failing the whole waste
                continue;
              }
            }
          }
          
          // Only add items with valid itemId
          if (itemId && !isNaN(Number(itemId))) {
            processedItems.push({
              itemId: Number(itemId),
              quantity: Number(item.quantity) || 0,
              estimatedValue: Number(item.estimatedValue) || 0,
              reason: item.reason || 'Điều chỉnh từ OCR',
              notes: item.notes || ''
            });
          } else {
            logger.warn('[DEBUG] confirmFormContent - Skipping waste item with invalid itemId', { 
              itemId, 
              itemName: item.name 
            });
          }
        }

        // Check if we have valid items
        if (processedItems.length === 0) {
          logger.error('[DEBUG] confirmFormContent - No valid items for waste/adjustment');
          return res.status(400).json({
            success: false,
            message: 'Không có sản phẩm hợp lệ để báo cáo hao hụt'
          });
        }

        const wasteData: any = {
          date: fields.find(f => f.name === 'date')?.value ? new Date(fields.find(f => f.name === 'date')?.value) : new Date(),
          wasteType: WasteType.OTHER,
          departmentId: Number(departmentId),
          description: fields.find(f => f.name === 'notes')?.value || 'Điều chỉnh từ OCR',
          processedById: userId,
          witnesses: [],
          evidencePhotos: draft.originalImage ? [draft.originalImage] : [],
          notes: fields.find(f => f.name === 'notes')?.value || '',
          status: WasteStatus.PENDING,
          items: processedItems
        };
        
        logger.info('[DEBUG] confirmFormContent - Calling wasteService.createWaste', { 
          departmentId: wasteData.departmentId,
          itemsCount: wasteData.items.length,
          wasteType: wasteData.wasteType
        });
        
        try {
          createdRecord = await wasteService.createWaste(wasteData);
          logger.info('[DEBUG] confirmFormContent - Waste created successfully', { 
            wasteId: createdRecord.id,
            itemsCount: createdRecord.items?.length
          });
        } catch (wasteError: any) {
          logger.error('[DEBUG] confirmFormContent - Error creating waste', { 
            error: wasteError.message,
            departmentId: wasteData.departmentId,
            itemsCount: wasteData.items.length
          });
          return res.status(500).json({
            success: false,
            message: `Lỗi khi tạo báo cáo hao hụt: ${wasteError.message || 'Unknown error'}`
          });
        }
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

      logger.info('[DEBUG] confirmFormContent - Success', { 
        formId, 
        userId, 
        type: draft.type, 
        createdRecordId: createdRecord?.id 
      });
      
      return res.json({
        success: true,
        message: 'Đã xác nhận và lưu vào dữ liệu thực tế. Nhà cung cấp, phòng ban và mặt hàng mới sẽ được tự động tạo trong hệ thống.',
        data: createdRecord
      });
    } catch (error: any) {
      logger.error('[DEBUG] confirmFormContent - Error', { 
        error: error.message, 
        formId: req.body?.formId,
        userId: // @ts-ignore
 req.user?.id
      });
      
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