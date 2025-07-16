const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Sử dụng schema riêng cho restaurant project
const SCHEMA_NAME = 'restaurant_inventory';

async function safeSetupDatabase() {
  try {
    console.log('🏗️ Tạo schema riêng cho restaurant project...');
    
    // Tạo connection với schema mặc định để tạo schema mới
    const adminPrisma = new PrismaClient();
    
    // Tạo schema riêng (không ảnh hưởng dự án khác)
    // Sử dụng string literal thay vì template literal để tránh lỗi syntax
    await adminPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA_NAME}"`);
    
    console.log(`✅ Schema "${SCHEMA_NAME}" đã được tạo an toàn`);
    
    await adminPrisma.$disconnect();
    
    console.log('📊 Schema setup hoàn thành!');
    console.log('🔧 Database sẵn sàng với schema riêng');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`✅ Schema "${SCHEMA_NAME}" đã tồn tại - OK!`);
    } else {
      console.error('❌ Lỗi setup:', error.message);
    }
  }
}

safeSetupDatabase(); 