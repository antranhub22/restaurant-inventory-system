import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const PORT = process.env.PORT || 4000;

// Enhanced database connection with retry mechanism for Render
async function connectDatabase(): Promise<boolean> {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000; // 3 seconds
  
  console.log('=== RENDER POSTGRESQL CONNECTION ===');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('💡 On Render, make sure PostgreSQL service is connected to your web service');
    console.error('💡 In development, create a .env file with DATABASE_URL');
    return false;
  }
  
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log('📊 Database Configuration:');
      console.log('   Host:', url.hostname);
      console.log('   Port:', url.port || '5432');
      console.log('   Database:', url.pathname.slice(1));
      console.log('   SSL Mode:', url.searchParams.get('sslmode') || 'prefer');
      
      if (url.hostname.startsWith('dpg-') && url.hostname.includes('render')) {
        console.log('   Provider: ✅ Render PostgreSQL');
      } else if (url.hostname.includes('render.com')) {
  console.log('   Provider: Render PostgreSQL');
      } else {
        console.log('   Provider: Custom PostgreSQL');
      }
    } catch (e) {
      console.error('❌ Invalid DATABASE_URL format:', e);
      return false;
    }
  } else {
    console.error('❌ DATABASE_URL not set');
    return false;
  }
  
  console.log('=====================================');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${MAX_RETRIES}...`);
      
      // Test basic connection
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      
      // Test query execution
      console.log('🔍 Testing database query...');
      const result = await prisma.$queryRaw`SELECT version() as version, now() as current_time`;
      console.log('✅ Database query successful');
      
      // Check schema safely
      console.log('📊 Checking database schema...');
      try {
        const userCount = await prisma.user.count();
        const itemCount = await prisma.item.count();
        console.log(`📈 Database ready - Users: ${userCount}, Items: ${itemCount}`);
      } catch (schemaError: any) {
        console.warn('⚠️ Database schema check failed, but connection is working:', schemaError?.message);
        console.log('💡 This usually means migrations need to be run');
        
        // Try to run migrations automatically in production
        if (process.env.NODE_ENV === 'production') {
          try {
            console.log('🔄 Attempting to run database migrations...');
            const { execSync } = require('child_process');
            
            // First try migrate deploy
            try {
              execSync('npx prisma migrate deploy', { stdio: 'inherit' });
              console.log('✅ Migrations completed successfully');
            } catch (migrateError) {
              console.log('⚠️ Migrate deploy failed, trying db push...');
              execSync('npx prisma db push', { stdio: 'inherit' });
              console.log('✅ Schema pushed successfully');
            }
            
            // Generate client
            execSync('npx prisma generate', { stdio: 'inherit' });
            console.log('✅ Prisma client generated');
            
          } catch (migrationError) {
            console.error('❌ Migration failed:', migrationError);
            console.log('⚠️ Application will continue but database operations may fail');
          }
        }
      }
      
      return true;
      
    } catch (error: any) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error?.message || error);
      
      // Enhanced error handling with specific guidance
      if (error?.code === 'P1001') {
        console.error('💡 Database server unreachable. Common causes:');
        console.error('   - Database service is still starting (wait 2-3 minutes)');
        console.error('   - Wrong DATABASE_URL (check Internal vs External URL)');
        console.error('   - Network/region mismatch (ensure same region)');
        console.error('   - Database service failed to start');
      } else if (error?.code === 'P1000') {
        console.error('💡 Authentication failed. Check:');
        console.error('   - Username/password in DATABASE_URL');
        console.error('   - Database credentials are correct');
      } else if (error?.code === 'P1003') {
        console.error('💡 Database does not exist. Check:');
        console.error('   - Database name in URL');
        console.error('   - Database service completed setup');
      } else {
        console.error('💡 Unexpected error:', error?.code || 'Unknown');
      }
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Waiting ${RETRY_DELAY/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error('💀 All database connection attempts failed!');
        
        // In production, log error but don't crash - let health check handle it
        if (process.env.NODE_ENV === 'production') {
          console.error('🚨 Production mode: Server will start but mark as unhealthy');
          return false;
        } else {
          process.exit(1);
        }
      }
    }
  }
  
  return false;
}

// Enhanced server startup
async function startServer() {
  console.log('🚀 Starting Restaurant Inventory Backend...');
  
  const dbConnected = await connectDatabase();
  
  if (!dbConnected && process.env.NODE_ENV === 'production') {
    console.log('⚠️ Starting server without database connection (will retry)');
  }
  
  // Add health endpoint directly
  app.get('/api/health', async (req, res) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Restaurant Inventory Backend is running'
    };
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthData.status = 'healthy';
      res.status(200).json(healthData);
    } catch (error) {
      healthData.status = 'unhealthy';
      res.status(503).json(healthData);
    }
  });

  const server = app.listen(PORT, () => {
    console.log(`\n🌐 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌍 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    
    if (dbConnected) {
      console.log(`✅ Database: Connected and ready`);
    } else {
      console.log(`⚠️ Database: Not connected (check health endpoint)`);
    }
    
    console.log(`\n💡 Ready to handle requests...`);
  });

  // Enhanced graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
    
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      
      try {
        await prisma.$disconnect();
        console.log('🗄️ Database disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting database:', error);
      }
      
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
startServer().catch((error) => {
  console.error('💀 Failed to start server:', error);
  process.exit(1);
}); 