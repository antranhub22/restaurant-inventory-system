import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Setup admin user endpoint (only for production setup)
router.post('/admin', async (req: Request, res: Response) => {
  try {
    // Check if any user exists
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      return (res as any).status(400).json({
        error: 'Users already exist. Setup not allowed.'
      });
    }

    // Create admin user with both admin/admin123 and owner/1234
    const adminHash = await bcrypt.hash('admin123', 10);
    const ownerHash = await bcrypt.hash('1234', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@restaurant.com', 
        passwordHash: adminHash,
        fullName: 'System Admin',
        phone: '0987654321',
        role: 'owner',
        department: 'IT',
        isActive: true,
        emailVerified: true,
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });

    const ownerUser = await prisma.user.create({
      data: {
        username: 'owner',
        email: 'owner@restaurant.com',
        passwordHash: ownerHash,
        fullName: 'Chủ Nhà Hàng',
        phone: '0123456789',
        role: 'owner',
        department: 'Quản lý',
        isActive: true,
        emailVerified: true,
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });

    (res as any).status(201).json({
      message: 'Admin users created successfully',
      users: [
        { username: 'admin', password: 'admin123' },
        { username: 'owner', password: '1234' }
      ]
    });
    
  } catch (error: any) {
    console.error('Setup admin error:', error);
    (res as any).status(500).json({
      error: 'Failed to create admin users',
      details: error.message
    });
  }
});

// Check users endpoint
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    
    (res as any).status(200).json({
      count: users.length,
      users
    });
  } catch (error: any) {
    (res as any).status(500).json({
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

export default router; 