import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest extends LoginRequest {
  fullName: string;
  role?: Role;
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthResponse {
  token: string;
  user: UserResponse;
}

const router = express.Router();
const prisma = new PrismaClient();

// Login
const login = async (
  req: Request<{}, AuthResponse | { error: string }, LoginRequest>,
  res: Response<AuthResponse | { error: string }>,
  _next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Tìm user bằng email hoặc username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

// Register
const register = async (
  req: Request<{}, AuthResponse | { error: string }, RegisterRequest>,
  res: Response<AuthResponse | { error: string }>,
  _next: NextFunction
): Promise<void> => {
  try {
    const { email, password, fullName, role = 'staff' } = req.body;
    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({ error: 'Tài khoản đã tồn tại' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const username = email.split('@')[0]; // Tạo username từ phần đầu của email
    
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        fullName,
        role
      }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

router.post('/login', login as express.RequestHandler);
router.post('/register', register as express.RequestHandler);

export default router; 