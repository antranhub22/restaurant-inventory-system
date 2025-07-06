import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed categories
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Đồ uống', description: 'Nước giải khát, bia, rượu', colorCode: '#3498db' },
      { name: 'Thịt tươi', description: 'Các loại thịt tươi sống', colorCode: '#e74c3c' },
      { name: 'Rau củ', description: 'Rau củ quả các loại', colorCode: '#27ae60' },
      { name: 'Gia vị', description: 'Gia vị, phụ liệu', colorCode: '#f1c40f' },
    ]
  });

  // Seed suppliers
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Nhà cung cấp A',
      contactPerson: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'nccA@example.com',
      address: '123 Đường Lớn, Quận 1, TP.HCM',
      paymentTerms: '30 ngày',
      isActive: true
    }
  });

  // Seed users
  const user = await prisma.user.create({
    data: {
      email: 'owner@restaurant.com',
      passwordHash: '$2b$10$hashdemo', // Demo hash, cần thay bằng hash thực tế
      fullName: 'Nguyễn Văn Chủ',
      role: 'owner',
      isActive: true
    }
  });

  // Seed items
  await prisma.item.create({
    data: {
      name: 'Bia Saigon 330ml',
      categoryId: 1,
      unit: 'chai',
      unitCost: 12000,
      minStock: 10,
      maxStock: 200,
      barcode: '8934567890123',
      description: 'Bia lon Saigon 330ml',
      isActive: true,
      primarySupplierId: supplier.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      aliases: ['Bia SG', 'Saigon Beer']
    }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 