import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import reconciliationService from '../services/reconciliation.service';

const prisma = new PrismaClient();

class ReconciliationController {
  async createReconciliation(req: Request, res: Response) {
    try {
      const reconciliation = await reconciliationService.createReconciliation(req.body);
      res.json({
        success: true,
        message: 'Tạo báo cáo đối chiếu thành công',
        data: reconciliation
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi tạo báo cáo đối chiếu' 
      });
    }
  }

  async getReconciliations(req: Request, res: Response) {
    try {
      const reconciliations = await prisma.reconciliation.findMany({
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
        data: reconciliations
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy danh sách đối chiếu' 
      });
    }
  }

  async getPendingReconciliations(req: Request, res: Response) {
    try {
      const pendingReconciliations = await prisma.reconciliation.findMany({
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
        data: pendingReconciliations
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy danh sách đối chiếu chờ duyệt' 
      });
    }
  }

  async getReconciliationById(req: Request, res: Response) {
    try {
      const reconciliation = await prisma.reconciliation.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          items: {
            include: {
              item: true
            }
          },
          department: true,
          processedBy: true
        }
      });
      
      if (reconciliation) {
        res.json({
          success: true,
          data: reconciliation
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy báo cáo đối chiếu' 
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy báo cáo đối chiếu' 
      });
    }
  }

  async updateReconciliation(req: Request, res: Response) {
    try {
      const reconciliation = await prisma.reconciliation.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
        include: {
          items: {
            include: {
              item: true
            }
          },
          department: true,
          processedBy: true
        }
      });
      res.json({
        success: true,
        message: 'Cập nhật báo cáo đối chiếu thành công',
        data: reconciliation
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi cập nhật báo cáo đối chiếu' 
      });
    }
  }

  async deleteReconciliation(req: Request, res: Response) {
    try {
      await prisma.reconciliation.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.json({
        success: true,
        message: 'Xóa báo cáo đối chiếu thành công'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi xóa báo cáo đối chiếu' 
      });
    }
  }

  async getReconciliationReport(req: Request, res: Response) {
    try {
      const report = await reconciliationService.generateReport(req.query);
      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi tạo báo cáo đối chiếu' 
      });
    }
  }

  async getVariances(req: Request, res: Response) {
    try {
      // Get reconciliations with significant variances
      const reconciliations = await prisma.reconciliation.findMany({
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

      // Calculate variances
      const variances = reconciliations.map(reconciliation => {
        const varianceItems = reconciliation.items.filter(item => {
          const variance = Math.abs(item.expectedStock - item.actualStock);
          return variance > 0; // Any difference is considered a variance
        });

        if (varianceItems.length > 0) {
          return {
            reconciliationId: reconciliation.id,
            date: reconciliation.date,
            department: reconciliation.department,
            shiftType: reconciliation.shiftType,
            status: reconciliation.status,
            totalVarianceItems: varianceItems.length,
            items: varianceItems.map(item => ({
              itemId: item.itemId,
              itemName: item.item.name,
              expectedStock: item.expectedStock,
              actualStock: item.actualStock,
              variance: item.actualStock - item.expectedStock,
              unit: item.item.unit
            }))
          };
        }
        return null;
      }).filter(Boolean);

      res.json({
        success: true,
        data: variances
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy danh sách chênh lệch' 
      });
    }
  }

  async approveReconciliation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const approvedById = req.user?.id ? parseInt(String(req.user.id)) : null;

      if (!approvedById) {
        return res.status(401).json({ 
          success: false, 
          message: 'Không xác định được người duyệt' 
        });
      }

      const approved = await prisma.reconciliation.update({
        where: { id },
        data: {
          status: 'approved',
          processedBy: { connect: { id: approvedById } },
          processedAt: new Date()
        },
        include: {
          items: {
            include: {
              item: true
            }
          },
          department: true,
          processedBy: true
        }
      });
      
      res.json({
        success: true,
        message: 'Đã duyệt báo cáo đối chiếu thành công',
        data: approved
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi duyệt báo cáo đối chiếu' 
      });
    }
  }

  async rejectReconciliation(req: Request, res: Response) {
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

      const rejected = await prisma.reconciliation.update({
        where: { id },
        data: {
          status: 'rejected',
          processedBy: { connect: { id: rejectedById } },
          processedAt: new Date(),
          notes: reason
        },
        include: {
          items: {
            include: {
              item: true
            }
          },
          department: true,
          processedBy: true
        }
      });
      
      res.json({
        success: true,
        message: 'Đã từ chối báo cáo đối chiếu',
        data: rejected
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi từ chối báo cáo đối chiếu' 
      });
    }
  }
}

export default new ReconciliationController(); 