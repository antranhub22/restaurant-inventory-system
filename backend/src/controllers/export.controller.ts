import { Request, Response } from 'express';
import exportService from '../services/export.service';
import { ExportData, ExportStatus } from '../types/export';

class ExportController {
  async createExport(req: Request, res: Response) {
    try {
      const exportData: ExportData = {
        ...req.body,
        processedById: req.user?.id,
        status: ExportStatus.PENDING
      };

      const result = await exportService.createExport(exportData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create export error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi tạo phiếu xuất'
      });
    }
  }

  async getExports(req: Request, res: Response) {
    try {
      const { status, departmentId, startDate, endDate } = req.query;
      
      const filters = {
        status: status as ExportStatus,
        departmentId: departmentId ? Number(departmentId) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const exports = await exportService.getExports(filters);
      res.json(exports);
    } catch (error) {
      console.error('Get exports error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy danh sách phiếu xuất'
      });
    }
  }

  async getExportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const export_data = await exportService.getExportById(Number(id));
      
      if (!export_data) {
        return res.status(404).json({
          error: 'Không tìm thấy phiếu xuất'
        });
      }

      res.json(export_data);
    } catch (error) {
      console.error('Get export error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy thông tin phiếu xuất'
      });
    }
  }

  async approveExport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approvedById = req.user?.id;

      if (!approvedById) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const result = await exportService.approveExport(Number(id), approvedById);
      res.json(result);
    } catch (error) {
      console.error('Approve export error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi duyệt phiếu xuất'
      });
    }
  }

  async rejectExport(req: Request, res: Response) {
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

      const result = await exportService.rejectExport(Number(id), rejectedById, reason);
      res.json(result);
    } catch (error) {
      console.error('Reject export error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi từ chối phiếu xuất'
      });
    }
  }
}

export default new ExportController(); 