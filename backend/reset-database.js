const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAndSetupDatabase() {
  try {
    console.log('🔄 Đang reset database...');
    
    // Xóa tất cả dữ liệu (trong thứ tự để tránh foreign key conflicts)
    await prisma.user.deleteMany();
    await prisma.item.deleteMany();
    await prisma.category.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.department.deleteMany();
    
    console.log('✅ Database đã được reset');
    
    // Tạo categories cơ bản
    console.log('📂 Tạo categories...');
    await prisma.category.createMany({
      data: [
        { name: 'Đồ uống', description: 'Nước giải khát, bia, rượu', colorCode: '#3498db' },
        { name: 'Thịt tươi sống', description: 'Các loại thịt tươi sống', colorCode: '#e74c3c' },
        { name: 'Hải sản', description: 'Cá, tôm, cua và các loại hải sản', colorCode: '#3498db' },
        { name: 'Rau củ quả', description: 'Rau xanh, củ quả các loại', colorCode: '#27ae60' },
        { name: 'Gia vị', description: 'Gia vị, nước mắm, tương ớt', colorCode: '#f1c40f' },
        { name: 'Thực phẩm khô', description: 'Gạo, bún, phở và các loại thực phẩm khô', colorCode: '#95a5a6' },
      ]
    });
    
    // Tạo users
    console.log('👥 Tạo users...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const managerHash = await bcrypt.hash('manager123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    
    await prisma.user.createMany({
      data: [
        {
          username: 'admin',
          email: 'admin@restaurant.com',
          passwordHash: adminHash,
          fullName: 'Administrator',
          role: 'owner'
        },
        {
          username: 'manager',
          email: 'manager@restaurant.com',
          passwordHash: managerHash,
          fullName: 'Quản lý nhà hàng',
          role: 'manager'
        },
        {
          username: 'staff',
          email: 'staff@restaurant.com',
          passwordHash: staffHash,
          fullName: 'Nhân viên',
          role: 'staff'
        }
      ]
    });

    console.log('✅ Setup hoàn thành!');
    console.log('\n🔐 Thông tin đăng nhập:');
    console.log('👑 Admin: admin@restaurant.com / admin123');
    console.log('🏢 Manager: manager@restaurant.com / manager123');
    console.log('👤 Staff: staff@restaurant.com / staff123');

  } catch (error) {
    console.error('❌ Lỗi setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSetupDatabase(); 