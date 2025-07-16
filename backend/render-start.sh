#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting restaurant inventory backend..."

# Tạo schema riêng (AN TOÀN - không ảnh hưởng dự án khác)
echo "🏗️ Creating safe schema for restaurant project..."
node safe-setup.js

# Push database schema vào schema riêng
echo "📊 Setting up database schema..."
npx prisma db push --accept-data-loss

# Tạo dữ liệu cơ bản
echo "🔧 Setting up initial data..."
npx prisma db seed

# Tạo users
echo "👥 Creating admin users..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createUsers() {
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const managerHash = await bcrypt.hash('manager123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    
    await prisma.user.createMany({
      data: [
        {
          username: 'admin',
          email: 'admin@restaurant.com',
          passwordHash: adminHash,
          fullName: 'Administrator',
          role: 'owner'
        },
        {
          username: 'manager',
          email: 'manager@restaurant.com',
          passwordHash: managerHash,
          fullName: 'Quản lý nhà hàng',
          role: 'manager'
        },
        {
          username: 'staff',
          email: 'staff@restaurant.com',
          passwordHash: staffHash,
          fullName: 'Nhân viên',
          role: 'staff'
        }
      ]
    });
    console.log('✅ Users created successfully!');
  } catch (error) {
    console.log('⚠️ Users may already exist:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}
createUsers();
"

echo "✅ Database setup complete!"

# Start the server
echo "🖥️ Starting server..."
node dist/server.js 