import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function setupAdminUser() {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'owner' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username);
      return existingAdmin;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@restaurant.vn',
        passwordHash: hashedPassword,
        fullName: 'Quản trị viên',
        role: 'owner',
        department: 'Quản lý',
        isActive: true,
        emailVerified: true,
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Email: admin@restaurant.vn');
    console.log('   Password: Admin123!');
    console.log('⚠️  Please change the default password after first login!');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Failed to setup admin user:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupAdminUser()
    .then(() => {
      console.log('🎉 Admin setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin setup failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}