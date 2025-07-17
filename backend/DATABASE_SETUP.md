# Database Setup Guide

## 🎯 Quick Setup (Recommended)

### 1. Setup Database với Full Data
```bash
cd backend
npm run db:setup
```

Tạo:
- ✅ Database schema
- ✅ Admin user (username: owner, password: 1234)
- ✅ Categories, suppliers, departments
- ✅ Sample items

### 2. Chỉ Setup Admin User
```bash
cd backend
npm run setup:admin
```

Chỉ tạo admin user mà không đụng data khác.

## 📋 Chi tiết các Commands

### Database Management
```bash
# Kiểm tra database connection
npm run db:check

# Setup database + seed data đầy đủ
npm run db:setup

# Reset database và seed lại (XÓA TẤT CẢ DATA!)
npm run db:reset

# Chỉ push schema mà không seed
npx prisma db push

# Chỉ chạy seed script
npm run seed
```

### Admin User Management
```bash
# Tạo hoặc reset admin user
npm run setup:admin

# Setup database + admin user (nhanh nhất)
npm run db:admin
```

## 👤 Admin Account

Sau khi setup, bạn có thể đăng nhập với:

| Field | Value |
|-------|-------|
| **Username** | `owner` |
| **Password** | `1234` |
| **Email** | `owner@restaurant.com` |
| **Role** | `Owner` |

## 🔧 Troubleshooting

### Database Connection Failed
```bash
# Debug database connection
npm run db:check

# Kiểm tra DATABASE_URL
echo $DATABASE_URL
```

### Admin User Already Exists
Script `setup:admin` sẽ tự động:
- ✅ Detect user đã tồn tại
- ✅ Reset password về `1234`
- ✅ Activate account

### Prisma Schema Changes
```bash
# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio
```

## 📊 Sample Data Included

### Categories (8)
- Đồ uống
- Thịt tươi sống  
- Hải sản
- Rau củ quả
- Gia vị
- Thực phẩm khô
- Sữa & Trứng
- Đồ đông lạnh

### Suppliers (5)
- Chợ Bến Thành
- Cty TNHH Hải Sản Tươi Sống
- Vissan
- Cty Gia Vị Cholimex
- Metro Cash & Carry

### Departments (5)
- Bếp chính (KITCHEN)
- Bếp lẩu (HOTPOT)
- Quầy bar (BAR)
- Kho (STORAGE)
- Phục vụ (SERVICE)

### Sample Items (7)
- Bia Heineken
- Coca Cola
- Thịt bò úc
- Thịt heo ba chỉ
- Tôm sú tươi
- Rau muống
- Nước mắm Phú Quốc

## 🚀 Production Deployment

### Render Deployment
Database sẽ tự động setup khi deploy lần đầu:

1. **Render tạo PostgreSQL service**
2. **Backend build và push schema**
3. **Chạy seed script tự động**

### Manual Production Setup
```bash
# Set environment variables
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret"

# Setup production database
npm run db:setup

# Or just admin user
npm run setup:admin
```

## 💡 Tips

### Development
- Sử dụng `npm run db:setup` cho lần đầu
- Sử dụng `npm run setup:admin` khi chỉ cần reset admin
- Sử dụng `npx prisma studio` để xem data

### Production
- Không bao giờ chạy `db:reset` trên production!
- Backup trước khi chạy migrations
- Test admin login ngay sau deploy

### Security
- Đổi password admin sau khi deploy production
- Set JWT_SECRET environment variable
- Không commit file .env có password thật