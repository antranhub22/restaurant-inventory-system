# Database Migration Guide - Từ neon.tech sang Database khác

## ⚠️ CẢNH BÁO QUAN TRỌNG
Việc thay đổi DATABASE_URL KHÔNG tự động migrate dữ liệu!
Bạn cần thực hiện các bước migration thủ công.

## 🔄 QUY TRÌNH MIGRATION

### Bước 1: Backup dữ liệu hiện tại
```bash
# Option 1: Sử dụng pg_dump (PostgreSQL)
pg_dump "postgresql://username:password@ep-xxx.neon.tech/database" > backup.sql

# Option 2: Sử dụng Prisma Studio export
npx prisma studio
# → Export từng table thành CSV/JSON

# Option 3: Sử dụng custom backup script
npm run backup-data
```

### Bước 2: Chuẩn bị database mới
```bash
# Tạo database mới (MySQL/PostgreSQL/etc.)
# Cập nhật DATABASE_URL trong .env
DATABASE_URL="postgresql://new_user:password@new_host:5432/new_database"
# hoặc
DATABASE_URL="mysql://user:password@localhost:3306/restaurant_db"
```

### Bước 3: Migrate schema
```bash
# Generate và apply migration cho database mới
npx prisma migrate dev --name init
# hoặc
npx prisma db push
```

### Bước 4: Import dữ liệu
```bash
# Option 1: SQL import
psql "postgresql://new_connection" < backup.sql

# Option 2: Prisma seed với dữ liệu backup
npm run import-data

# Option 3: Manual import qua Prisma Studio
```

## 🛠️ MIGRATION TOOLS

### A. Prisma Migration
```typescript
// prisma/migrate-data.ts
import { PrismaClient } from '@prisma/client'

const oldDb = new PrismaClient({
  datasources: { db: { url: 'neon.tech_url' } }
})

const newDb = new PrismaClient({
  datasources: { db: { url: 'new_database_url' } }
})

async function migrateData() {
  // Migrate Users
  const users = await oldDb.user.findMany()
  for (const user of users) {
    await newDb.user.create({ data: user })
  }
  
  // Migrate Categories  
  const categories = await oldDb.category.findMany()
  for (const category of categories) {
    await newDb.category.create({ data: category })
  }
  
  // ... migrate all tables
}
```

### B. Database-specific Tools
```bash
# PostgreSQL → PostgreSQL
pg_dump source_db | psql target_db

# PostgreSQL → MySQL
pgloader postgresql://source mysql://target

# MySQL → PostgreSQL  
pgloader mysql://source postgresql://target
```

## 📊 CÁC LOẠI DATABASE ĐƯỢC HỖ TRỢ

### Prisma hỗ trợ:
- ✅ **PostgreSQL** (neon.tech, Supabase, PlanetScale)
- ✅ **MySQL** (PlanetScale, Railway, local)
- ✅ **SQLite** (local development)
- ✅ **SQL Server** (Azure SQL)
- ✅ **MongoDB** (Atlas, local)

### Migration matrix:
```
neon.tech (PostgreSQL) → 
  ├── Supabase (PostgreSQL) ✅ Easy
  ├── PlanetScale (MySQL) ⚠️ Schema changes needed  
  ├── Railway (PostgreSQL) ✅ Easy
  ├── Local PostgreSQL ✅ Easy
  └── SQLite ⚠️ Data type conversion needed
```

## ⚠️ RỦI RO & LƯU Ý

### Rủi ro cao:
- 🔥 **Mất dữ liệu** nếu không backup đúng cách
- 🔥 **Downtime** trong quá trình migration
- 🔥 **Schema conflicts** giữa database types

### Lưu ý quan trọng:
- 📋 **Foreign keys** cần migrate đúng thứ tự
- 🔢 **Auto-increment IDs** có thể bị conflict
- 📅 **Date/Time formats** khác nhau giữa DB types
- 💾 **JSON fields** (Prisma Json type) cần kiểm tra compatibility

## 🧪 TEST MIGRATION

### Môi trường test:
```bash
# 1. Clone database hiện tại
DATABASE_URL_OLD="neon.tech_url"
DATABASE_URL_NEW="test_database_url"

# 2. Test migration trên dataset nhỏ
npm run test-migration

# 3. Verify data integrity
npm run verify-migration

# 4. Performance testing
npm run benchmark-new-db
```

## 📋 CHECKLIST MIGRATION

### Trước migration:
- [ ] Backup toàn bộ dữ liệu
- [ ] Test migration trên môi trường test
- [ ] Thông báo downtime cho users
- [ ] Chuẩn bị rollback plan

### Sau migration:
- [ ] Verify data integrity
- [ ] Test tất cả API endpoints
- [ ] Check performance
- [ ] Update monitoring/alerts
- [ ] Thông báo completion

## 🚀 MỘT SỐ DATABASE ALTERNATIVES

### Managed PostgreSQL:
- **Supabase** - Similar to neon.tech, good choice
- **Railway** - Simple deployment
- **Render** - Integrated with your current hosting

### Local Development:
```bash
# Docker PostgreSQL
docker run -d \
  --name restaurant-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=restaurant_inventory \
  -p 5432:5432 \
  postgres:15

DATABASE_URL="postgresql://postgres:password@localhost:5432/restaurant_inventory"
```

## 🎯 KHUYẾN NGHỊ

**Nếu muốn migrate:**
1. **Test thoroughly** trên environment riêng
2. **Backup multiple times** từ nhiều sources
3. **Consider Supabase** (tương tự neon.tech)
4. **Plan downtime** cho production migration
5. **Have rollback plan** nếu có issues

**Nếu hài lòng với neon.tech:**
- Performance tốt, scaling tự động
- Backup tự động, reliability cao  
- Integration tốt với Prisma
- Chi phí reasonable cho production 