import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - be careful in production)
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
        email: 'benthanhmarket@example.com',
        address: 'Lê Lợi, Quận 1, TP.HCM',
        paymentTerms: 'Thanh toán ngay',
        notes: 'Chuyên cung cấp rau củ quả tươi'
      },
      {
        name: 'Cty TNHH Hải Sản Tươi Sống',
        contactPerson: 'Chị Lan',
        phone: '0912345678',
        email: 'haisantuoisong@example.com',
        address: 'Cầu Mống, Quận 1, TP.HCM',
        paymentTerms: 'Chuyển khoản trong 7 ngày',
        notes: 'Cung cấp hải sản tươi sống chất lượng cao'
      },
      {
        name: 'Vissan',
        contactPerson: 'Anh Tuấn',
        phone: '0923456789',
        email: 'vissan@example.com',
        address: 'Quận Tân Bình, TP.HCM',
        paymentTerms: 'Chuyển khoản trong 15 ngày',
        notes: 'Thịt heo, thịt bò, thịt gà và các sản phẩm chế biến'
      },
      {
        name: 'Cty Gia Vị Cholimex',
        contactPerson: 'Bà Hương',
        phone: '0934567890',
        email: 'cholimex@example.com',
        address: 'Quận Bình Thạnh, TP.HCM',
        paymentTerms: 'Thanh toán ngay',
        notes: 'Gia vị, nước mắm, tương ớt các loại'
      },
      {
        name: 'Metro Cash & Carry',
        contactPerson: 'Mr. John',
        phone: '0945678901',
        email: 'metro@example.com',
        address: 'Quận 2, TP.HCM',
        paymentTerms: 'Chuyển khoản trong 30 ngày',
        notes: 'Siêu thị bán buôn, đa dạng sản phẩm'
      }
    ]
  });

  // 4. Create departments
  console.log('🏢 Creating departments...');
  const departments = await prisma.department.createMany({
    data: [
      {
        name: 'Bếp chính',
        code: 'KITCHEN',
        description: 'Bếp chính - nấu các món ăn chính'
      },
      {
        name: 'Bếp lẩu',
        code: 'HOTPOT',
        description: 'Bếp chuyên làm lẩu và nướng'
      },
      {
        name: 'Quầy bar',
        code: 'BAR',
        description: 'Pha chế đồ uống, cocktail'
      },
      {
        name: 'Kho',
        code: 'STORAGE',
        description: 'Kho lưu trữ nguyên liệu'
      },
      {
        name: 'Phục vụ',
        code: 'SERVICE',
        description: 'Đội ngũ phục vụ khách hàng'
      }
    ]
  });

  // 5. Create some sample items
  console.log('📦 Creating sample items...');
  const categoryRecords = await prisma.category.findMany();
  const supplierRecords = await prisma.supplier.findMany();

  const sampleItems = await prisma.item.createMany({
    data: [
      // Đồ uống
      {
        name: 'Bia Heineken (chai)',
        categoryId: categoryRecords.find(c => c.name === 'Đồ uống')?.id!,
        unit: 'chai',
        unitCost: 35000,
        minStock: 50,
        maxStock: 500,
        aliases: ['heineken', 'bia heineken'],
        primarySupplierId: supplierRecords[4]?.id // Metro
      },
      {
        name: 'Coca Cola (lon)',
        categoryId: categoryRecords.find(c => c.name === 'Đồ uống')?.id!,
        unit: 'lon',
        unitCost: 15000,
        minStock: 100,
        maxStock: 1000,
        aliases: ['coca', 'cola', 'nước ngọt'],
        primarySupplierId: supplierRecords[4]?.id
      },
      // Thịt
      {
        name: 'Thịt bò úc (kg)',
        categoryId: categoryRecords.find(c => c.name === 'Thịt tươi sống')?.id!,
        unit: 'kg',
        unitCost: 350000,
        minStock: 5,
        maxStock: 50,
        expiryDays: 3,
        aliases: ['thịt bò', 'beef'],
        primarySupplierId: supplierRecords[2]?.id // Vissan
      },
      {
        name: 'Thịt heo ba chỉ (kg)',
        categoryId: categoryRecords.find(c => c.name === 'Thịt tươi sống')?.id!,
        unit: 'kg',
        unitCost: 180000,
        minStock: 10,
        maxStock: 100,
        expiryDays: 2,
        aliases: ['ba chỉ', 'thịt heo', 'pork belly'],
        primarySupplierId: supplierRecords[2]?.id
      },
      // Hải sản
      {
        name: 'Tôm sú tươi (kg)',
        categoryId: categoryRecords.find(c => c.name === 'Hải sản')?.id!,
        unit: 'kg',
        unitCost: 450000,
        minStock: 2,
        maxStock: 20,
        expiryDays: 1,
        aliases: ['tôm sú', 'shrimp'],
        primarySupplierId: supplierRecords[1]?.id // Hải sản tươi sống
      },
      // Rau củ
      {
        name: 'Rau muống (bó)',
        categoryId: categoryRecords.find(c => c.name === 'Rau củ quả')?.id!,
        unit: 'bó',
        unitCost: 5000,
        minStock: 20,
        maxStock: 200,
        expiryDays: 2,
        aliases: ['muống', 'rau muống'],
        primarySupplierId: supplierRecords[0]?.id // Chợ Bến Thành
      },
      // Gia vị
      {
        name: 'Nước mắm Phú Quốc (chai)',
        categoryId: categoryRecords.find(c => c.name === 'Gia vị')?.id!,
        unit: 'chai',
        unitCost: 35000,
        minStock: 10,
        maxStock: 100,
        aliases: ['nước mắm', 'fish sauce'],
        primarySupplierId: supplierRecords[3]?.id // Cholimex
      }
    ]
  });

  console.log('✅ Database seeding completed!');
  console.log('==========================================');
  console.log('🎉 SETUP HOÀN TẤT!');
  console.log('==========================================');
  console.log('👤 Admin Account:');
  console.log('   Username: owner');
  console.log('   Password: 1234');
  console.log('   Email: owner@restaurant.com');
  console.log('   Role: Owner');
  console.log('');
  console.log('📊 Created:');
  console.log(`   - 1 admin user`);
  console.log(`   - ${categoryRecords.length} categories`);
  console.log(`   - 5 suppliers`);
  console.log(`   - 5 departments`);
  console.log(`   - 7 sample items`);
  console.log('');
  console.log('🚀 Ready for production use!');
  console.log('🌐 You can now login to the system');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 