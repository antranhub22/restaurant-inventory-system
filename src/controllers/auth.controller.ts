import { Request, Response } from 'express';
import { loginService } from '../services/auth.service';

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