import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import exportService from '../services/export.service';

const prisma = new PrismaClient();

class ExportController {
  async createExport(req: Request, res: Response) {
    try {
      const export_ = await prisma.export.create({
        data: req.body
      });
      res.json(export_);
    } catch (error) {
      res.status(500).json({ error: 'Could not create export' });
    }
  }

  async getExports(req: Request, res: Response) {
    try {
      const exports = await prisma.export.findMany();
      res.json(exports);
    } catch (error) {
      res.status(500).json({ error: 'Could not get exports' });
    }
  }

  async getExportById(req: Request, res: Response) {
    try {
      const export_ = await prisma.export.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (export_) {
        res.json(export_);
      } else {
        res.status(404).json({ error: 'Export not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get export' });
    }
  }

  async updateExport(req: Request, res: Response) {
    try {
      const export_ = await prisma.export.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(export_);
    } catch (error) {
      res.status(500).json({ error: 'Could not update export' });
    }
  }

  async deleteExport(req: Request, res: Response) {
    try {
      await prisma.export.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete export' });
    }
  }

  /**
   * Approve export record và cập nhật inventory
   */
  async approveExport(req: Request, res: Response) {
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

      const approved = await exportService.approveExport(id, approvedById);
      
      res.json({
        success: true,
        message: 'Đã duyệt phiếu xuất kho thành công',
        data: approved
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi duyệt phiếu xuất kho' 
      });
    }
  }

  /**
   * Reject export record
   */
  async rejectExport(req: Request, res: Response) {
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

      const rejected = await exportService.rejectExport(id, rejectedById, reason);
      
      res.json({
        success: true,
        message: 'Đã từ chối phiếu xuất kho',
        data: rejected
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi từ chối phiếu xuất kho' 
      });
    }
  }

  /**
   * Get pending exports for approval
   */
  async getPendingExports(req: Request, res: Response) {
    try {
      const pendingExports = await prisma.export.findMany({
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
        data: pendingExports
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy danh sách phiếu xuất chờ duyệt' 
      });
    }
  }
}

export default new ExportController(); 