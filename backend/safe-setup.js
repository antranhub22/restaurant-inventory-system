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
    await adminPrisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${SCHEMA_NAME};`;
    
    console.log(`✅ Schema "${SCHEMA_NAME}" đã được tạo an toàn`);
    
    await adminPrisma.$disconnect();
    
    console.log('📊 Schema setup hoàn thành!');
    console.log('🔧 Bây giờ cần cập nhật DATABASE_URL để sử dụng schema riêng');
    console.log(`   Thêm: ?schema=${SCHEMA_NAME} vào cuối DATABASE_URL`);
    
  } catch (error) {
    console.error('❌ Lỗi setup:', error);
  }
}

safeSetupDatabase(); 