// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAdmin() {
  console.log('👤 Setting up admin user...');
  
  // Debug environment
  console.log('📊 Environment check:');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'set ✅' : 'not set ❌');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('💡 Make sure .env file exists with DATABASE_URL');
    process.exit(1);
  }
  
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'owner' },
          { email: 'owner@restaurant.com' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('1234', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          passwordHash: hashedPassword,
          isActive: true
        }
      });
      
      console.log('✅ Password updated to: 1234');
      return;
    }

    // Create new admin user
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

    console.log('✅ Admin user created successfully!');
    console.log('==========================================');
    console.log('🎉 ADMIN SETUP COMPLETE!');
    console.log('==========================================');
    console.log('👤 Login Credentials:');
    console.log('   Username: owner');
    console.log('   Password: 1234');
    console.log('   Email: owner@restaurant.com');
    console.log('   Role: Owner');
    console.log('');
    console.log('🌐 You can now login to the system!');

  } catch (error) {
    console.error('❌ Failed to setup admin user:', error);
    
    if (error.code === 'P2002') {
      console.error('💡 User with this username or email already exists');
    } else if (error.code === 'P1001') {
      console.error('💡 Cannot connect to database - check DATABASE_URL');
    }
    
    throw error;
  }
}

setupAdmin()
  .catch((error) => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });