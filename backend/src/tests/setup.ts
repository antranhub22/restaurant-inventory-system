import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reset database before all tests
beforeAll(async () => {
  // Xóa dữ liệu test cũ
  await prisma.$transaction([
    prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    }),
    // Thêm các bảng khác nếu cần
  ]);
});

// Cleanup sau khi chạy tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Tạo thư mục logs nếu chưa có
import fs from 'fs';
import path from 'path';

const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Mock Redis cho tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    call: jest.fn()
  }));
}); 