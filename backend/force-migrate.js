const { execSync } = require('child_process');

console.log('🚀 Force running database migrations...');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

try {
  console.log('🔄 Running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: process.env 
  });
  console.log('✅ Migrations completed successfully!');
  
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: process.env 
  });
  console.log('✅ Prisma client generated!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('🔄 Trying fallback: prisma db push...');
  
  try {
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: process.env 
    });
    console.log('✅ Schema pushed successfully!');
  } catch (pushError) {
    console.error('❌ Both migration and push failed:', pushError.message);
    process.exit(1);
  }
}

console.log('🎉 Database setup completed!');