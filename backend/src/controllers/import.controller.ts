import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import importService from '../services/import.service';

const prisma = new PrismaClient();

class ImportController {
  async createImport(req: Request, res: Response) {
    try {
      const import_ = await prisma.import.create({
        data: req.body
      });
      res.json(import_);
    } catch (error) {
      res.status(500).json({ error: 'Could not create import' });
    }
  }

  async getImports(req: Request, res: Response) {
    try {
      const imports = await prisma.import.findMany();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: 'Could not get imports' });
    }
  }

  async getImportById(req: Request, res: Response) {
    try {
      const import_ = await prisma.import.findUnique({
        where: { id: parseInt(req.params.id) }
      });
      if (import_) {
        res.json(import_);
      } else {
        res.status(404).json({ error: 'Import not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Could not get import' });
    }
  }

  async updateImport(req: Request, res: Response) {
    try {
      const import_ = await prisma.import.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
      });
      res.json(import_);
    } catch (error) {
      res.status(500).json({ error: 'Could not update import' });
    }
  }

  async deleteImport(req: Request, res: Response) {
    try {
      await prisma.import.delete({
        where: { id: parseInt(req.params.id) }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Could not delete import' });
    }
  }

  /**
   * Approve import record và cập nhật inventory
   */
  async approveImport(req: Request, res: Response) {
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

      const approved = await importService.approveImport(id, approvedById);
      
      res.json({
        success: true,
        message: 'Đã duyệt phiếu nhập kho thành công',
        data: approved
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi duyệt phiếu nhập kho' 
      });
    }
  }

  /**
   * Reject import record
   */
  async rejectImport(req: Request, res: Response) {
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

      const rejected = await importService.rejectImport(id, rejectedById, reason);
      
      res.json({
        success: true,
        message: 'Đã từ chối phiếu nhập kho',
        data: rejected
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi từ chối phiếu nhập kho' 
      });
    }
  }

  /**
   * Get pending imports for approval
   */
  async getPendingImports(req: Request, res: Response) {
    try {
      const pendingImports = await prisma.import.findMany({
        where: { status: 'pending' },
        include: {
          items: {
            include: {
              item: true
            }
          },
          supplier: true,
          processedBy: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        data: pendingImports
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi lấy danh sách phiếu nhập chờ duyệt' 
      });
    }
  }
}

export default new ImportController(); 