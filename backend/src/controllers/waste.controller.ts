import { Request, Response } from 'express';
import wasteService from '../services/waste.service';
import { WasteData, WasteStatus } from '../types/waste';

class WasteController {
  async createWaste(req: Request, res: Response) {
    try {
      const wasteData: WasteData = {
        ...req.body,
        processedById: req.user?.id,
        status: WasteStatus.PENDING
      };

      const result = await wasteService.createWaste(wasteData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create waste error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi tạo báo cáo hao hụt'
      });
    }
  }

  async getWastes(req: Request, res: Response) {
    try {
      const { status, departmentId, wasteType, startDate, endDate } = req.query;
      
      const filters = {
        status: status as WasteStatus,
        departmentId: departmentId ? Number(departmentId) : undefined,
        wasteType: wasteType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const wastes = await wasteService.getWastes(filters);
      res.json(wastes);
    } catch (error) {
      console.error('Get wastes error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy danh sách báo cáo hao hụt'
      });
    }
  }

  async getWasteById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const waste = await wasteService.getWasteById(Number(id));
      
      if (!waste) {
        return res.status(404).json({
          error: 'Không tìm thấy báo cáo hao hụt'
        });
      }

      res.json(waste);
    } catch (error) {
      console.error('Get waste error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy thông tin báo cáo hao hụt'
      });
    }
  }

  async approveWaste(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await wasteService.approveWaste(Number(id), req.user?.id || 0);
      res.json(result);
    } catch (error) {
      console.error('Approve waste error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi duyệt báo cáo hao hụt'
      });
    }
  }

  async rejectWaste(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          error: 'Vui lòng cung cấp lý do từ chối'
        });
      }

      const result = await wasteService.rejectWaste(Number(id), req.user?.id || 0, reason);
      res.json(result);
    } catch (error) {
      console.error('Reject waste error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi từ chối báo cáo hao hụt'
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

      const result = await wasteService.addAttachment(Number(id), file);
      res.json(result);
    } catch (error) {
      console.error('Upload attachment error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi upload file đính kèm'
      });
    }
  }
}

export default new WasteController(); 