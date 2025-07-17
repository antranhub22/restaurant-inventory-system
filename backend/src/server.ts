import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Test database connection
async function connectDatabase() {
  try {
    // Debug database URL
    console.log('=== DATABASE DEBUG ===');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        console.log('Database host:', url.hostname);
        console.log('Database port:', url.port || '5432');
        if (url.hostname.includes('neon.tech')) {
          console.log('Provider: Neon.tech');
        } else if (url.hostname.startsWith('dpg-')) {
          console.log('Provider: Render PostgreSQL ✅');
        } else {
          console.log('Provider: Custom PostgreSQL');
        }
      } catch (e) {
        console.log('Invalid DATABASE_URL format');
      }
    }
    console.log('======================');
    
    console.log('🔄 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Database ready - Found ${userCount} users`);
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    // Provide helpful troubleshooting info
    if (error?.code === 'P1001') {
      console.error('💡 Database server unreachable. Please check:');
      console.error('   - Database service is running');
      console.error('   - Network connectivity');
      console.error('   - DATABASE_URL is correct');
    }
    
    console.error('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Don't exit in production, let Render handle restarts
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
}

// Enable detailed logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Running in development mode with detailed logging');
}

// Start server with database connection
async function startServer() {
  await connectDatabase();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`\n💡 Ready to handle requests...`);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
}); 