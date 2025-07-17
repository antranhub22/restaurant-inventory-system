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

// Enhanced connection settings
const MAX_RETRIES = 10; // Increased from 5 for better production reliability
const INITIAL_RETRY_DELAY = 2000; // Start with 2 seconds
const MAX_RETRY_DELAY = 30000; // Max 30 seconds between attempts
const CONNECTION_TIMEOUT = 15000; // 15 second timeout per attempt

async function connectDatabase(): Promise<boolean> {
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

  // Exponential backoff retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Database connection attempt ${attempt}/${MAX_RETRIES}...`);
      
      // Test basic connection with timeout
      const connectPromise = prisma.$connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      console.log('✅ Database connected successfully');
      
      // Test query execution with timeout
      console.log('🔍 Testing database query...');
      const queryPromise = prisma.$queryRaw`SELECT version() as version, now() as current_time`;
      const queryTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );
      
      const result = await Promise.race([queryPromise, queryTimeout]);
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
              execSync('npx prisma migrate deploy', { 
                stdio: 'inherit', 
                timeout: 60000, // 1 minute timeout for migrations
                cwd: process.cwd()
              });
              console.log('✅ Migrations completed successfully');
            } catch (migrateError) {
              console.log('⚠️ Migrate deploy failed, trying db push...');
              execSync('npx prisma db push --force-reset', { 
                stdio: 'inherit', 
                timeout: 60000,
                cwd: process.cwd()
              });
              console.log('✅ Schema pushed successfully');
            }
            
            // Generate client
            execSync('npx prisma generate', { 
              stdio: 'inherit', 
              timeout: 30000,
              cwd: process.cwd()
            });
            console.log('✅ Prisma client generated');
            
            // Verify schema after migration
            const postMigrationCount = await prisma.user.count();
            console.log(`✅ Post-migration verification - Users: ${postMigrationCount}`);
            
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
        console.error('   - Database host/port incorrect');
      } else if (error?.code === 'P1000') {
        console.error('💡 Authentication failed:');
        console.error('   - Wrong username/password in DATABASE_URL');
        console.error('   - Database user permissions insufficient');
      } else if (error?.code === 'P1003') {
        console.error('💡 Database does not exist:');
        console.error('   - Database name in URL is incorrect');
        console.error('   - Database service not properly initialized');
      } else if (error?.message?.includes('timeout')) {
        console.error('💡 Connection timeout:');
        console.error('   - Database server is overloaded');
        console.error('   - Network latency issues');
        console.error('   - Consider increasing timeout values');
      } else if (error?.message?.includes('ENOTFOUND')) {
        console.error('💡 DNS resolution failed:');
        console.error('   - Database hostname is incorrect');
        console.error('   - Network connectivity issues');
      } else {
        console.error('💡 Unexpected error:', error?.code || 'Unknown');
      }
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
        console.log(`⏳ Waiting ${delay/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retry attempts failed
  console.error('💀 All database connection attempts failed!');
  
  // In production, log error but don't crash - let health check handle it
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Production mode: Server will start but mark as unhealthy');
    console.error('⚠️ Starting server without database connection (will retry)');
    return false;
  } else {
    console.error('🛑 Development mode: Exiting due to database connection failure');
    process.exit(1);
  }
}

// Enhanced server startup
async function startServer() {
  console.log('🚀 Starting Restaurant Inventory Backend...');
  
  const dbConnected = await connectDatabase();
  
  if (!dbConnected && process.env.NODE_ENV === 'production') {
    console.log('⚠️ Starting server without database connection (will retry)');
  }
  
  // Add health endpoint directly with setup capability
  app.get('/api/health', async (req, res) => {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Restaurant Inventory Backend is running',
      queryParams: req.query
    };
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthData.status = 'healthy';
      
      // If force=true query param, force create admin user
      if (req.query.force === 'true') {
        try {
          const bcrypt = require('bcryptjs');
          
          // Delete existing admin users to recreate
          await prisma.user.deleteMany({
            where: {
              OR: [
                { username: 'admin' },
                { email: 'admin@restaurant.com' }
              ]
            }
          });

          // Create admin user with admin/admin123
          const adminHash = await bcrypt.hash('admin123', 10);
          
          const adminUser = await prisma.user.create({
            data: {
              username: 'admin',
              email: 'admin@restaurant.com',
              passwordHash: adminHash,
              fullName: 'System Admin',
              phone: '0987654321',
              role: 'owner',
              department: 'IT',
              isActive: true,
              emailVerified: true,
              language: 'vi',
              timezone: 'Asia/Ho_Chi_Minh'
            }
          });

          (healthData as any).message = '✅ Admin user created successfully!';
          (healthData as any).adminCreated = {
            username: 'admin',
            password: 'admin123',
            email: 'admin@restaurant.com',
            id: adminUser.id
          };
        } catch (setupError) {
          (healthData as any).setupError = setupError.message;
          (healthData as any).message = '❌ Failed to create admin user';
        }
      }
      
      // If setup=true query param, create admin users (only if none exist)
      if (req.query.setup === 'true') {
        try {
          const bcrypt = require('bcryptjs');
          
          // Check if users exist
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            // Create admin users
            const adminHash = await bcrypt.hash('admin123', 10);
            const ownerHash = await bcrypt.hash('1234', 10);
            
            await prisma.user.create({
              data: {
                username: 'admin',
                email: 'admin@restaurant.com',
                passwordHash: adminHash,
                fullName: 'System Admin',
                phone: '0987654321',
                role: 'owner',
                department: 'IT',
                isActive: true,
                emailVerified: true,
                language: 'vi',
                timezone: 'Asia/Ho_Chi_Minh'
              }
            });

            await prisma.user.create({
              data: {
                username: 'owner',
                email: 'owner@restaurant.com',
                passwordHash: ownerHash,
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

            (healthData as any).message = 'Admin users created successfully!';
            (healthData as any).credentials = [
              { username: 'admin', password: 'admin123' },
              { username: 'owner', password: '1234' }
            ];
          } else {
            (healthData as any).message = 'Users already exist';
            (healthData as any).userCount = userCount;
          }
        } catch (setupError) {
          (healthData as any).setupError = setupError.message;
        }
      }
      
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