import express, { Request, Response } from 'express';
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
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response<AuthResponse | { error: string }>): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Tìm user bằng email hoặc username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { email: email.toLowerCase() } // Hỗ trợ cả lowercase
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
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Register
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response<AuthResponse | { error: string }>): Promise<void> => {
  try {
    const { email, password, fullName, role = 'staff' } = req.body;
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ error: 'Tài khoản đã tồn tại' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
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
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router; 