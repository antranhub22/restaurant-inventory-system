import { Request, Response } from 'express';
import { listItemsService, createItemService, updateItemService, deleteItemService } from '../services/item.service';

export const listItemsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await listItemsService(page, limit);
    return res.status(200).json({ success: true, data: result.items, meta: result.meta });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'LIST_ITEMS_FAILED', message: error.message || 'Không lấy được danh sách hàng hóa' } });
  }
};

export const createItemController = async (req: Request, res: Response) => {
  try {
    const item = await createItemService(req.body);
    return res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'CREATE_ITEM_FAILED', message: error.message || 'Không tạo được hàng hóa' } });
  }
};

export const updateItemController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'ID không hợp lệ.' } });
    const updated = await updateItemService(id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'UPDATE_ITEM_FAILED', message: error.message || 'Không cập nhật được hàng hóa' } });
  }
};

export const deleteItemController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'ID không hợp lệ.' } });
    const result = await deleteItemService(id);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'DELETE_ITEM_FAILED', message: error.message || 'Không xóa được hàng hóa' } });
  }
}; 