const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔑 Tạo tài khoản admin...');
    
    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Tạo admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@restaurant.com',
        passwordHash: passwordHash,
        fullName: 'Administrator',
        role: 'owner'
      }
    });

    console.log('✅ Tài khoản admin đã được tạo:');
    console.log('📧 Email/Username: admin@restaurant.com hoặc admin');
    console.log('🔐 Password: admin123');
    console.log('👑 Role: owner');
    
    // Tạo thêm một số user test
    const manager = await prisma.user.create({
      data: {
        username: 'manager',
        email: 'manager@restaurant.com',
        passwordHash: await bcrypt.hash('manager123', 10),
        fullName: 'Quản lý nhà hàng',
        role: 'manager'
      }
    });

    const staff = await prisma.user.create({
      data: {
        username: 'staff',
        email: 'staff@restaurant.com',
        passwordHash: await bcrypt.hash('staff123', 10),
        fullName: 'Nhân viên',
        role: 'staff'
      }
    });

    console.log('\n👥 Các tài khoản test khác:');
    console.log('🏢 Manager: manager@restaurant.com / manager123');
    console.log('👤 Staff: staff@restaurant.com / staff123');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  User đã tồn tại!');
      console.log('📧 Thông tin đăng nhập:');
      console.log('   Email: admin@restaurant.com');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.error('❌ Lỗi tạo user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 