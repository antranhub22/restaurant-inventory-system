import { Request, Response } from 'express';
import { listUsersService, createUserService, updateUserService, deleteUserService } from '../services/user.service';

export const listUsersController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await listUsersService(page, limit);
    return res.status(200).json({ success: true, data: result.users, meta: result.meta });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'LIST_USERS_FAILED', message: error.message || 'Không lấy được danh sách người dùng' } });
  }
};

export const createUserController = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Vui lòng nhập đầy đủ thông tin.' } });
    }
    const user = await createUserService({ email, password, full_name, role });
    return res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'CREATE_USER_FAILED', message: error.message || 'Không tạo được người dùng' } });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'ID không hợp lệ.' } });
    const { full_name, role, is_active, password } = req.body;
    const updated = await updateUserService(id, { full_name, role, is_active, password });
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'UPDATE_USER_FAILED', message: error.message || 'Không cập nhật được người dùng' } });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'ID không hợp lệ.' } });
    const currentUserId = (req as any).user?.id;
    const result = await deleteUserService(id, currentUserId);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 500).json({ success: false, error: { code: error.code || 'DELETE_USER_FAILED', message: error.message || 'Không xóa được người dùng' } });
  }
}; 