import { Request, Response } from 'express';
import { loginService, refreshService, logoutService, meService } from '../services/auth.service';

/**
 * Đăng nhập hệ thống
 * @route POST /api/auth/login
 */
export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password, req.headers['user-agent'] || '');
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 400).json({ success: false, error: { code: error.code || 'LOGIN_FAILED', message: error.message || 'Đăng nhập thất bại' } });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
export const refreshController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshService(refreshToken);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(error.status || 400).json({ success: false, error: { code: error.code || 'REFRESH_FAILED', message: error.message || 'Làm mới token thất bại' } });
  }
};

/**
 * Logout
 * @route POST /api/auth/logout
 */
export const logoutController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    await logoutService(refreshToken);
    return res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error: any) {
    return res.status(error.status || 400).json({ success: false, error: { code: error.code || 'LOGOUT_FAILED', message: error.message || 'Đăng xuất thất bại' } });
  }
};

/**
 * Lấy thông tin user hiện tại
 * @route GET /api/auth/me
 */
export const meController = async (req: Request, res: Response) => {
  try {
    const user = await meService(req.user.id);
    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(error.status || 400).json({ success: false, error: { code: error.code || 'ME_FAILED', message: error.message || 'Không lấy được thông tin người dùng' } });
  }
}; 