import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  // Create basic category structure for Vietnamese restaurants
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Đồ uống', description: 'Nước giải khát, bia, rượu', colorCode: '#3498db' },
      { name: 'Thịt tươi sống', description: 'Các loại thịt tươi sống', colorCode: '#e74c3c' },
      { name: 'Hải sản', description: 'Cá, tôm, cua và các loại hải sản', colorCode: '#3498db' },
      { name: 'Rau củ quả', description: 'Rau xanh, củ quả các loại', colorCode: '#27ae60' },
      { name: 'Gia vị', description: 'Gia vị, nước mắm, tương ớt', colorCode: '#f1c40f' },
      { name: 'Thực phẩm khô', description: 'Gạo, bún, phở và các loại thực phẩm khô', colorCode: '#95a5a6' },
    ]
  });

  console.log('🌱 Database initialized with basic structure!');
  console.log('📊 Created categories for Vietnamese restaurant inventory');
  console.log('✅ Ready for production data entry');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 