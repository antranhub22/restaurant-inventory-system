import { Request, Response } from 'express';
import { listInventoryService, receiveInventoryService, withdrawInventoryService, adjustInventoryService, inventoryHistoryService } from '../services/inventory.service';

export const listInventoryController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await listInventoryService(page, limit);
    return res.status(200).json({ success: true, data: result.inventory, meta: result.meta });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'LIST_INVENTORY_FAILED', message: error.message || 'Không lấy được danh sách tồn kho' } });
  }
};

export const receiveInventoryController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const result = await receiveInventoryService(req.body, userId);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'RECEIVE_FAILED', message: error.message || 'Không nhập kho được' } });
  }
};

export const withdrawInventoryController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const result = await withdrawInventoryService(req.body, userId);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'WITHDRAW_FAILED', message: error.message || 'Không xuất kho được' } });
  }
};

export const adjustInventoryController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const result = await adjustInventoryService(req.body, userId);
    return res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'ADJUST_FAILED', message: error.message || 'Không điều chỉnh tồn kho được' } });
  }
};

export const inventoryHistoryController = async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId);
    if (isNaN(itemId)) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'ID không hợp lệ.' } });
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await inventoryHistoryService(itemId, page, limit);
    return res.status(200).json({ success: true, data: result.transactions, meta: result.meta });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'HISTORY_FAILED', message: error.message || 'Không lấy được lịch sử giao dịch' } });
  }
}; 