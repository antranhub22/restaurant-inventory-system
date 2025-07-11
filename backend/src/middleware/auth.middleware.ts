import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Không cần AuthRequest riêng, dùng luôn Express.Request đã mở rộng

interface JwtPayload {
  userId: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }

    const token: string = (authHeader && typeof authHeader === 'string' && authHeader.split(' ')[1]) ? authHeader.split(' ')[1] : '';

    // 2. Verify token
    const jwtSecret: string = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, jwtSecret);

    // Type guard cho payload
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'userId' in decoded
    ) {
      // 3. Lấy thông tin user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          role: true,
          permissions: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User không tồn tại hoặc đã bị vô hiệu hóa'
        });
      }

      // 4. Gắn thông tin user vào request
      req.user = {
        id: user.id, // Keep as number for consistency
        username: user.username ? user.username.toString() : '',
        role: user.role ? user.role.toString() : '',
        permissions: Array.isArray(user.permissions) ? user.permissions as string[] : []
      };

      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Chưa xác thực người dùng' });
      }

      if (!allowedRoles.includes(req.user.role || '')) {
        return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
      }

      next();
    } catch (error) {
      return res.status(403).json({ message: 'Lỗi kiểm tra quyền' });
    }
  };
};