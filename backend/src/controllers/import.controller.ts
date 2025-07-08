import { Request, Response } from 'express';
import importService from '../services/import.service';
import { ImportData, ImportStatus } from '../types/import';
import { authorize } from '../middleware/auth.middleware';

class ImportController {
  async createImport(req: Request, res: Response) {
    try {
      const importData: ImportData = {
        ...req.body,
        processedById: req.user?.id,
        status: ImportStatus.PENDING
      };

      const result = await importService.createImport(importData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create import error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi tạo phiếu nhập'
      });
    }
  }

  async getImports(req: Request, res: Response) {
    try {
      const { status, startDate, endDate, supplierId } = req.query;
      
      const filters = {
        status: status as ImportStatus,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        supplierId: supplierId ? Number(supplierId) : undefined
      };

      const imports = await importService.getImports(filters);
      res.json(imports);
    } catch (error) {
      console.error('Get imports error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy danh sách phiếu nhập'
      });
    }
  }

  async getImportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const import_data = await importService.getImportById(Number(id));
      
      if (!import_data) {
        return res.status(404).json({
          error: 'Không tìm thấy phiếu nhập'
        });
      }

      res.json(import_data);
    } catch (error) {
      console.error('Get import error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy thông tin phiếu nhập'
      });
    }
  }

  async approveImport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approvedById = req.user?.id;

      if (!approvedById) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const result = await importService.approveImport(Number(id), approvedById);
      res.json(result);
    } catch (error) {
      console.error('Approve import error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi duyệt phiếu nhập'
      });
    }
  }

  async rejectImport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const rejectedById = req.user?.id;

      if (!rejectedById) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      if (!reason) {
        return res.status(400).json({
          error: 'Vui lòng cung cấp lý do từ chối'
        });
      }

      const result = await importService.rejectImport(Number(id), rejectedById, reason);
      res.json(result);
    } catch (error) {
      console.error('Reject import error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi từ chối phiếu nhập'
      });
    }
  }

  async uploadAttachment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: 'Không tìm thấy file'
        });
      }

      const result = await importService.addAttachment(Number(id), file);
      res.json(result);
    } catch (error) {
      console.error('Upload attachment error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi tải lên file đính kèm'
      });
    }
  }
}

export default new ImportController(); 