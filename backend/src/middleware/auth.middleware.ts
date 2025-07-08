import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: Role;
    permissions?: string[];
  };
}

interface JwtPayload {
  userId: number;
}

export const authMiddleware = async (
  req: AuthRequest,
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

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Type guard cho payload
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'userId' in payload
    ) {
      // 3. Lấy thông tin user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
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
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions as string[]
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
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Chưa xác thực người dùng' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
      }

      next();
    } catch (error) {
      return res.status(403).json({ message: 'Lỗi kiểm tra quyền' });
    }
  };
};