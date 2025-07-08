import { Request, Response } from 'express';
import returnService from '../services/return.service';
import { ReturnData, ReturnStatus } from '../types/return';

class ReturnController {
  async createReturn(req: Request, res: Response) {
    try {
      const returnData: ReturnData = {
        ...req.body,
        processedById: req.user?.id,
        status: ReturnStatus.PENDING
      };

      const result = await returnService.createReturn(returnData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create return error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi tạo phiếu hoàn trả'
      });
    }
  }

  async getReturns(req: Request, res: Response) {
    try {
      const { status, departmentId, startDate, endDate } = req.query;
      
      const filters = {
        status: status as ReturnStatus,
        departmentId: departmentId ? Number(departmentId) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const returns = await returnService.getReturns(filters);
      res.json(returns);
    } catch (error) {
      console.error('Get returns error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy danh sách phiếu hoàn trả'
      });
    }
  }

  async getReturnById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const return_data = await returnService.getReturnById(Number(id));
      
      if (!return_data) {
        return res.status(404).json({
          error: 'Không tìm thấy phiếu hoàn trả'
        });
      }

      res.json(return_data);
    } catch (error) {
      console.error('Get return error:', error);
      res.status(500).json({
        error: 'Lỗi khi lấy thông tin phiếu hoàn trả'
      });
    }
  }

  async approveReturn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approvedById = req.user?.id;

      if (!approvedById) {
        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const result = await returnService.approveReturn(Number(id), approvedById);
      res.json(result);
    } catch (error) {
      console.error('Approve return error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi duyệt phiếu hoàn trả'
      });
    }
  }

  async rejectReturn(req: Request, res: Response) {
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

      const result = await returnService.rejectReturn(Number(id), rejectedById, reason);
      res.json(result);
    } catch (error) {
      console.error('Reject return error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Lỗi khi từ chối phiếu hoàn trả'
      });
    }
  }
}

export default new ReturnController(); 