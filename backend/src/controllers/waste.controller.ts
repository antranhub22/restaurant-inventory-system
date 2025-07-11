import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import wasteService from '../services/waste.service';

const prisma = new PrismaClient();

class WasteController {
  async createWaste(req: Request, res: Response) {
    try {
      const waste = await prisma.waste.create({
        data: req.body
      });
      res.json(waste);
    } catch (error) {
      res.status(500).json({ error: 'Could not create waste' });
    }
  }

  async getWastes(req: Request, res: Response) {
    try {
      const wastes = await prisma.waste.findMany();
      res.json(wastes);
    } catch (error) {
      res.status(500).json({ error: 'Could not get wastes' });
    }
  }

  async getWasteById(req: Request, res: Response) {
    try {
      const waste = await prisma.waste.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (waste) {
        res.json(waste);
      } else {
        res.status(404).json({ error: 'Waste not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get waste' });
    }
  }

  async updateWaste(req: Request, res: Response) {
    try {
      const waste = await prisma.waste.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(waste);
    } catch (error) {
      res.status(500).json({ error: 'Could not update waste' });
    }
  }

  async deleteWaste(req: Request, res: Response) {
    try {
      await prisma.waste.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete waste' });
    }
  }

  /**
   * Approve waste record và cập nhật inventory
   */
  async approveWaste(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const approvedById = req.user?.id ? parseInt(String(req.user.id)) : null;

      if (!approvedById) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không xác định được người duyệt' 
        });
      }

      const approved = await wasteService.approveWaste(id, approvedById);
      
      res.json({
        success: true,
        message: 'Đã duyệt báo cáo hao hụt thành công',
        data: approved
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi duyệt báo cáo hao hụt' 
      });
    }
  }

  /**
   * Reject waste record
   */
  async rejectWaste(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const rejectedById = req.user?.id ? parseInt(String(req.user.id)) : null;
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

      const rejected = await wasteService.rejectWaste(id, rejectedById, reason);
      
      res.json({
        success: true,
        message: 'Đã từ chối báo cáo hao hụt',
        data: rejected
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi từ chối báo cáo hao hụt' 
      });
    }
  }

  /**
   * Get pending wastes for approval
   */
  async getPendingWastes(req: Request, res: Response) {
    try {
      const pendingWastes = await prisma.waste.findMany({
        where: { status: 'pending' },
        include: {
          items: {
            include: {
              item: true
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
        data: pendingWastes
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy danh sách báo cáo hao hụt chờ duyệt' 
      });
    }
  }
}

export default new WasteController(); 