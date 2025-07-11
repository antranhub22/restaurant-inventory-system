# Auto-Migration System - Hướng Dẫn Sử Dụng

## Tổng Quan

**Auto-Migration System** tự động phát hiện khi `DATABASE_URL` thay đổi và migration toàn bộ dữ liệu từ database cũ sang database mới. Hệ thống này đặc biệt hữu ích khi:

- Chuyển từ neon.tech sang provider khác (Supabase, Railway, local PostgreSQL)
- Upgrade/downgrade database instance
- Di chuyển từ development sang production
- Backup và restore dữ liệu

## Tính Năng Chính

✅ **Tự động phát hiện thay đổi DATABASE_URL**  
✅ **Backup dữ liệu từ database cũ**  
✅ **Setup schema trên database mới**  
✅ **Import dữ liệu với integrity checking**  
✅ **Hỗ trợ PostgreSQL, MySQL, SQLite**  
✅ **API endpoints để monitor và control**  
✅ **Shell script để management dễ dàng**  
✅ **Logging chi tiết và error handling**  

## 🚀 Cách Kích Hoạt

### 1. Bật Auto-Migration

```bash
# Cách 1: Sử dụng script
./auto-migration.sh enable

# Cách 2: Thêm vào .env file
echo "AUTO_MIGRATION_ENABLED=true" >> .env
```

### 2. Restart Server

```bash
npm run dev
# hoặc
npm start
```

### 3. Kiểm Tra Status

```bash
./auto-migration.sh status
```

## 📋 Các Lệnh Quản Lý

### Script Commands

```bash
# Enable auto-migration
./auto-migration.sh enable

# Disable auto-migration  
./auto-migration.sh disable

# Kiểm tra status local
./auto-migration.sh status

# Kiểm tra status qua API
./auto-migration.sh check

# Trigger migration thủ công
./auto-migration.sh trigger

# Test database connection
./auto-migration.sh test "postgresql://user:pass@host:5432/db"

# Backup database hiện tại
./auto-migration.sh backup

# Hiển thị help
./auto-migration.sh help
```

### API Endpoints

```bash
# Kiểm tra migration status
GET /api/migration/status

# Trigger manual migration
POST /api/migration/trigger

# Health check (bao gồm migration status)
GET /api/health
```

## 🔄 Quy Trình Migration Tự Động

Khi phát hiện `DATABASE_URL` thay đổi, hệ thống sẽ:

```
1. 🔍 Phát hiện thay đổi DATABASE_URL
2. 💾 Backup dữ liệu từ database cũ  
3. 🏗️  Setup schema trên database mới
4. 📤 Import dữ liệu vào database mới
5. ✅ Verify data integrity
6. 💾 Save config mới
7. 🌱 Seed additional data nếu cần
8. ✅ Hoàn thành migration
```

## 📚 Các Kịch Bản Sử Dụng

### Kịch Bản 1: Chuyển từ Neon.tech sang Supabase

```bash
# 1. Đảm bảo auto-migration đã bật
./auto-migration.sh enable

# 2. Backup database hiện tại (khuyến nghị)
./auto-migration.sh backup

# 3. Thay đổi DATABASE_URL trong .env
DATABASE_URL="postgresql://user:pass@db.supabase.co:5432/postgres"

# 4. Restart server
npm run dev

# 5. Kiểm tra migration status
./auto-migration.sh check
```

### Kịch Bản 2: Test với Local PostgreSQL

```bash
# 1. Cài đặt PostgreSQL local
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# 2. Tạo database mới
createdb restaurant_inventory_local

# 3. Update DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/restaurant_inventory_local"

# 4. Restart server - auto-migration sẽ chạy
npm run dev
```

### Kịch Bản 3: Migration Thủ Công

```bash
# Nếu cần trigger migration manually
curl -X POST http://localhost:3000/api/migration/trigger

# Hoặc dùng script
./auto-migration.sh trigger
```

## ⚙️ Configuration

### Environment Variables

```bash
# Bật/tắt auto-migration
AUTO_MIGRATION_ENABLED=true

# Database URL (thay đổi để trigger migration)
DATABASE_URL="postgresql://..."

# Optional: Custom port
PORT=3000
```

### File Paths

```
backend/
├── .db-config.json          # Lưu config database hiện tại
├── backups/                 # Thư mục chứa backup files
│   ├── backup-2024-01-15T10-30-00.sql
│   └── backup-2024-01-15T11-45-00.sql
├── auto-migration.sh        # Management script
└── src/services/
    └── auto-migration.service.ts  # Core service
```

## 🔍 Monitoring & Debugging

### Kiểm Tra Logs

```bash
# Logs sẽ hiển thị với prefix [AUTO-MIGRATION]
tail -f logs/app.log | grep "AUTO-MIGRATION"
```

### API Responses

```typescript
// GET /api/migration/status
{
  "enabled": true,
  "hasChanges": false,
  "inProgress": false,
  "currentUrl": "configured"
}

// POST /api/migration/trigger
{
  "success": true,
  "message": "Migration completed successfully",
  "details": {
    "backupFile": "/path/to/backup.sql",
    "oldProvider": "postgresql",
    "newProvider": "postgresql"
  }
}
```

### Health Check

```bash
curl http://localhost:3000/api/health
```

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "services": {
    "database": "connected",
    "redis": "connected",
    "autoMigration": "ready"
  }
}
```

## ⚠️ Lưu Ý Quan Trọng

### Security

- ✅ Database passwords được mask trong logs
- ✅ Backup files chứa data nhạy cảm - cần bảo mật
- ✅ Chỉ enable trong môi trường tin cậy

### Performance

- ⏱️ Migration time phụ thuộc vào data size
- 💾 Cần đủ disk space cho backup files
- 🔄 Server vẫn hoạt động trong khi migration

### Data Safety

- 💾 **QUAN TRỌNG**: Luôn backup trước khi migration
- ✅ System verify data integrity sau migration
- 🔄 Có thể rollback bằng backup files

## 🛠️ Troubleshooting

### Lỗi thường gặp

```bash
# 1. Permission denied cho pg_dump
chmod +x auto-migration.sh
sudo apt install postgresql-client

# 2. Database connection failed
./auto-migration.sh test "your-database-url"

# 3. Migration in progress
# Đợi migration hiện tại hoàn thành hoặc restart server

# 4. Backup failed
# Kiểm tra disk space và database credentials
```

### Debug Commands

```bash
# Kiểm tra database tools
which pg_dump
which psql

# Test connection
./auto-migration.sh test "$DATABASE_URL"

# Check logs
tail -f logs/app.log
```

## 📈 Advanced Usage

### Custom Migration Logic

```typescript
// Extend auto-migration service cho custom logic
import autoMigrationService from './services/auto-migration.service';

// Custom pre-migration hook
async function customPreMigration() {
  // Your custom logic here
  console.log('Running custom pre-migration tasks...');
}

// Custom post-migration hook  
async function customPostMigration() {
  // Your custom logic here
  console.log('Running custom post-migration tasks...');
}
```

### Integration với CI/CD

```yaml
# GitHub Actions example
- name: Enable Auto-Migration
  run: echo "AUTO_MIGRATION_ENABLED=true" >> .env

- name: Deploy with Migration
  run: |
    npm run build
    npm start
```

## 🤝 Hỗ Trợ

Nếu gặp vấn đề:

1. 📋 Kiểm tra logs với `[AUTO-MIGRATION]` prefix
2. 🧪 Test database connection với script
3. 💾 Tạo backup manual trước khi troubleshoot
4. 🔄 Restart server nếu migration bị stuck

---

**Lưu ý**: Auto-Migration System là công cụ mạnh mẽ nhưng cần sử dụng cẩn thận. Luôn backup dữ liệu quan trọng trước khi thực hiện migration. 