import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import returnService from '../services/return.service';

const prisma = new PrismaClient();

class ReturnController {
  async createReturn(req: Request, res: Response) {
    try {
      const return_ = await prisma.return.create({
        data: req.body
      });
      res.json(return_);
    } catch (error) {
      res.status(500).json({ error: 'Could not create return' });
    }
  }

  async getReturns(req: Request, res: Response) {
    try {
      const returns = await prisma.return.findMany();
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: 'Could not get returns' });
    }
  }

  async getReturnById(req: Request, res: Response) {
    try {
      const return_ = await prisma.return.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (return_) {
        res.json(return_);
      } else {
        res.status(404).json({ error: 'Return not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get return' });
    }
  }

  async updateReturn(req: Request, res: Response) {
    try {
      const return_ = await prisma.return.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(return_);
    } catch (error) {
      res.status(500).json({ error: 'Could not update return' });
    }
  }

  async deleteReturn(req: Request, res: Response) {
    try {
      await prisma.return.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete return' });
    }
  }

  /**
   * Approve return record và cập nhật inventory
   */
  async approveReturn(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const approvedById = // @ts-ignore
 req.user?.id ? parseInt(String(req.user.id)) : null;

      if (!approvedById) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không xác định được người duyệt' 
        });
      }

      const approved = await returnService.approveReturn(id, approvedById);
      
      res.json({
        success: true,
        message: 'Đã duyệt phiếu hoàn kho thành công',
        data: approved
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi duyệt phiếu hoàn kho' 
      });
    }
  }

  /**
   * Reject return record
   */
  async rejectReturn(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const rejectedById = // @ts-ignore
 req.user?.id ? parseInt(String(req.user.id)) : null;
      const { reason } = req.body;

      if (!rejectedById) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không xác định được người từ chối' 
        });
      }

      if (!reason) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vui lòng nhập lý do từ chối' 
        });
      }

      const rejected = await returnService.rejectReturn(id, rejectedById, reason);
      
      res.json({
        success: true,
        message: 'Đã từ chối phiếu hoàn kho',
        data: rejected
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi từ chối phiếu hoàn kho' 
      });
    }
  }

  /**
   * Get pending returns for approval
   */
  async getPendingReturns(req: Request, res: Response) {
    try {
      const pendingReturns = await prisma.return.findMany({
        where: { status: 'pending' },
        include: {
          items: {
            include: {
              item: true,
              originalExport: true
            }
          },
          department: true,
          processedBy: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: pendingReturns
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy danh sách phiếu hoàn chờ duyệt' 
      });
    }
  }
}

export default new ReturnController(); 