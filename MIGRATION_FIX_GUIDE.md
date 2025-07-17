# Fix Migration Error - Hướng Dẫn Khắc Phục Lỗi Database Schema

## ❌ Lỗi Hiện Tại
```
prisma:error
Invalid `prisma.user.count()` invocation:
The table 'public.User' does not exist in the current database.
```

## ✅ Giải Pháp Đã Implement

### 1. Auto-Migration tại Server Startup
- Server sẽ tự động chạy migrations khi phát hiện lỗi schema
- Fallback mechanism: migrate deploy → db push
- Tự động generate Prisma client

### 2. Manual Migration API
- `GET /api/migration/status` - Kiểm tra trạng thái
- `POST /api/migration/trigger` - Trigger migration thủ công

## 🚀 Cách Khắc Phục

### Bước 1: Restart Service (Khuyến nghị)
**Vào Render Dashboard:**
1. Services → restaurant-inventory-backend
2. Click **"Manual Deploy"** hoặc **"Restart Service"**
3. Theo dõi logs để xem auto-migration chạy

### Bước 2: Kiểm tra Logs
Sau khi restart, logs sẽ hiển thị:
```
🔄 Attempting to run database migrations...
✅ Migrations completed successfully
✅ Prisma client generated
```

### Bước 3: Verify
```bash
# Check health
curl https://restaurant-inventory-backend.onrender.com/api/health

# Check migration status  
curl https://restaurant-inventory-backend.onrender.com/api/migration/status
```

## 🔧 Alternative: Manual Trigger

Nếu restart không hoạt động:
```bash
# Trigger migration qua API
curl -X POST https://restaurant-inventory-backend.onrender.com/api/migration/trigger
```

## 📝 Files Modified
- `backend/src/server.ts` - Auto-migration logic
- `backend/src/routes/migration.routes.ts` - New migration API
- `backend/src/app.ts` - Route registration

Lỗi này sẽ được tự động fix khi restart service!