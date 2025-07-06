import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'Bạn cần đăng nhập để truy cập.' } });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // Lấy user từ DB để đảm bảo user còn tồn tại và active
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Tài khoản không hợp lệ hoặc đã bị khóa.' } });
    }
    // Gán user vào req để controller sử dụng
    (req as any).user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token không hợp lệ hoặc đã hết hạn.' } });
  }
};

/**
 * Middleware kiểm tra vai trò người dùng
 * @param allowedRoles - Mảng các role được phép truy cập
 */
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập chức năng này.' } });
    }
    next();
  };
} 