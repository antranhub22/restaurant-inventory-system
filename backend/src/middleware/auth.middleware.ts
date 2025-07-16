import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

interface CustomJwtPayload extends BaseJwtPayload {
  userId: number;
  email: string;
  role: Role;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        message: 'Không tìm thấy token xác thực'
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback-secret'
      ) as CustomJwtPayload;

      if (!decoded.userId || !decoded.email || !decoded.role) {
        res.status(401).json({
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
        return;
      }

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      res.status(401).json({
        message: 'Token không hợp lệ hoặc đã hết hạn',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  } catch (error) {
    res.status(401).json({
      message: 'Lỗi xác thực',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const checkRole = (allowedRoles: Role[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Chưa xác thực người dùng' });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ message: 'Không có quyền thực hiện thao tác này' });
        return;
      }

      next();
    } catch (error) {
      res.status(403).json({ message: 'Lỗi kiểm tra quyền' });
    }
  };
};