const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if data already exists
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('📊 Database already seeded - skipping');
      return;
    }

    // Clear existing data (for clean setup)
    console.log('🗑️ Clearing existing data...');
    await prisma.user.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.category.deleteMany({});

    // 1. Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('1234', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'owner',
        email: 'owner@restaurant.com',
        passwordHash: hashedPassword,
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

    // 2. Create basic category structure for Vietnamese restaurants
    console.log('📂 Creating categories...');
    const categories = await prisma.category.createMany({
      data: [
        { name: 'Đồ uống', description: 'Nước giải khát, bia, rượu', colorCode: '#3498db', sortOrder: 1 },
        { name: 'Thịt tươi sống', description: 'Các loại thịt tươi sống', colorCode: '#e74c3c', sortOrder: 2 },
        { name: 'Hải sản', description: 'Cá, tôm, cua và các loại hải sản', colorCode: '#2980b9', sortOrder: 3 },
        { name: 'Rau củ quả', description: 'Rau xanh, củ quả các loại', colorCode: '#27ae60', sortOrder: 4 },
        { name: 'Gia vị', description: 'Gia vị, nước mắm, tương ớt', colorCode: '#f1c40f', sortOrder: 5 },
        { name: 'Thực phẩm khô', description: 'Gạo, bún, phở và các loại thực phẩm khô', colorCode: '#95a5a6', sortOrder: 6 },
        { name: 'Sữa & Trứng', description: 'Sữa tươi, trứng gà, các sản phẩm từ sữa', colorCode: '#f39c12', sortOrder: 7 },
        { name: 'Đồ đông lạnh', description: 'Thực phẩm đông lạnh, kem', colorCode: '#85c1e9', sortOrder: 8 }
      ]
    });

    // 3. Create suppliers
    console.log('🏪 Creating suppliers...');
    const suppliers = await prisma.supplier.createMany({
      data: [
        {
          name: 'Chợ Bến Thành',
          contactPerson: 'Anh Minh',
          phone: '0901234567',
          email: 'chobenthanh@supplier.com',
          address: '123 Lê Lợi, Quận 1, TP.HCM',
          notes: 'Rau củ quả tươi hàng ngày',
          isActive: true
        },
        {
          name: 'Công ty TNHH Thịt tươi Sài Gòn',
          contactPerson: 'Chị Lan',
          phone: '0912345678',
          email: 'thittuoi@supplier.com',
          address: '456 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
          notes: 'Thịt heo, thịt bò chất lượng cao',
          isActive: true
        },
        {
          name: 'Kho Hải Sản Vũng Tàu',
          contactPerson: 'Anh Hải',
          phone: '0923456789',
          email: 'haisan@supplier.com',
          address: '789 Trương Công Định, Vũng Tàu',
          notes: 'Hải sản tươi sống từ Vũng Tàu',
          isActive: true
        }
      ]
    });

    // 4. Create departments
    console.log('🏢 Creating departments...');
    const departments = await prisma.department.createMany({
      data: [
        { name: 'Bếp chính', description: 'Bộ phận chế biến món chính', isActive: true },
        { name: 'Bếp lạnh', description: 'Bộ phận chế biến salad, tráng miệng', isActive: true },
        { name: 'Quầy bar', description: 'Bộ phận pha chế đồ uống', isActive: true },
        { name: 'Kho', description: 'Bộ phận quản lý kho hàng', isActive: true },
        { name: 'Quản lý', description: 'Bộ phận quản lý nhà hàng', isActive: true }
      ]
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('🎯 Login credentials:');
    console.log('   Username: owner');
    console.log('   Password: 1234');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { main };