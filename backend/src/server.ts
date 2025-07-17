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
  
  // Add health endpoint directly with setup capability
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
      
      // If login params, handle login
      if (req.query.email && req.query.password) {
        try {
          const bcrypt = require('bcryptjs');
          const jwt = require('jsonwebtoken');
          
          // Find user
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: req.query.email as string },
                { username: req.query.email as string }
              ]
            }
          });

          if (!user) {
            return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
          }

          // Check password
          const validPassword = await bcrypt.compare(req.query.password as string, user.passwordHash);
          if (!validPassword) {
            return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
          }

          // Create JWT token
          const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
          );

          return res.status(200).json({
            success: true,
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              fullName: user.fullName,
              role: user.role
            }
          });
        } catch (loginError) {
          return res.status(500).json({ error: 'Login failed', details: loginError.message });
        }
      }
      
      // If setup=true query param, create admin users
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

            healthData.message = 'Admin users created successfully!';
            healthData.credentials = [
              { username: 'admin', password: 'admin123' },
              { username: 'owner', password: '1234' }
            ];
          } else {
            healthData.message = 'Users already exist';
            healthData.userCount = userCount;
          }
        } catch (setupError) {
          healthData.setupError = setupError.message;
        }
      }
      
      res.status(200).json(healthData);
    } catch (error) {
      healthData.status = 'unhealthy';
      res.status(503).json(healthData);
    }
  });

  // Simple login endpoint directly in server.ts
  app.get('/api/login', async (req, res) => {
    try {
      const { email, password } = req.query;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
      
      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email as string },
            { username: email as string }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password as string, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed', details: error.message });
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