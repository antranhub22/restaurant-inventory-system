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
        error: error instanceof Error ? error.message : 'Lỗi khi tạo phiếu nhập kho'
      });
    }
  }

  async getImports(req: Request, res: Response) {
    try {
      const { status, supplierId, startDate, endDate } = req.query;
      
      const filters = {
        status: status as ImportStatus,
        supplierId: supplierId ? Number(supplierId) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const imports = await importService.getImports(filters);
      res.json(imports);
    } catch (error) {
      console.error('Get imports error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy danh sách phiếu nhập kho'
      });
    }
  }

  async getImportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const importData = await importService.getImportById(Number(id));
      
      if (!importData) {
        return res.status(404).json({
          error: 'Không tìm thấy phiếu nhập kho'
        });
      }

      res.json(importData);
    } catch (error) {
      console.error('Get import error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy thông tin phiếu nhập kho'
      });
    }
  }

  async approveImport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await importService.approveImport(Number(id), req.user?.id || 0);
      res.json(result);
    } catch (error) {
      console.error('Approve import error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi duyệt phiếu nhập kho'
      });
    }
  }

  async rejectImport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          error: 'Vui lòng cung cấp lý do từ chối'
        });
      }

      const result = await importService.rejectImport(Number(id), req.user?.id || 0, reason);
      res.json(result);
    } catch (error) {
      console.error('Reject import error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi từ chối phiếu nhập kho'
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
        error: error instanceof Error ? error.message : 'Lỗi khi upload file đính kèm'
      });
    }
  }
}

export default new ImportController(); 