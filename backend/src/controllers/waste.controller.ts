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
      const waste_data = await wasteService.getWasteById(Number(id));
      
      if (!waste_data) {
        return res.status(404).json({
          error: 'Không tìm thấy báo cáo hao hụt'
        });
      }

      res.json(waste_data);
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
      const approvedById = req.user?.id;

      if (!approvedById) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const result = await wasteService.approveWaste(Number(id), approvedById);
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

      const result = await wasteService.rejectWaste(Number(id), rejectedById, reason);
      res.json(result);
    } catch (error) {
      console.error('Reject waste error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi từ chối báo cáo hao hụt'
      });
    }
  }

  async generateReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, departmentId, wasteType } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Vui lòng cung cấp khoảng thời gian báo cáo'
        });
      }

      const filters = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        departmentId: departmentId ? Number(departmentId) : undefined,
        wasteType: wasteType as string
      };

      const report = await wasteService.generateWasteReport(filters);
      res.json(report);
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({
        error: 'Lỗi khi tạo báo cáo thống kê hao hụt'
      });
    }
  }
}

export default new WasteController(); 