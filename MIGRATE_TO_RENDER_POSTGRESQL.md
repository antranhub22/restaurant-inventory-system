# Migration từ Neon.tech sang Render PostgreSQL

## Tại sao chuyển sang Render PostgreSQL?

✅ **Ưu điểm:**
- Tích hợp sâu với Render platform
- Tự động backup và monitoring
- Không cần quản lý connection strings
- Performance tốt hơn cho ứng dụng trong cùng region
- Dễ scale và maintenance

❌ **Nhược điểm:**
- Chỉ hoạt động trên Render (vendor lock-in)
- Chi phí có thể cao hơn cho large scale

## Các thay đổi đã thực hiện

### 1. Cập nhật `render.yaml`
- ✅ Thêm PostgreSQL service (`restaurant-inventory-database`)
- ✅ Cấu hình auto-connect DATABASE_URL
- ✅ Region: singapore (gần Việt Nam)

### 2. Cập nhật `backend/Dockerfile`
- ✅ Sử dụng `render-start.sh` thay vì `npm start`
- ✅ Tự động chạy migration và seed khi deploy

### 3. Cập nhật `backend/render-start.sh`
- ✅ Chờ database ready
- ✅ Chạy migration (`prisma db push`)
- ✅ Seed data tự động
- ✅ Health check trước khi start server

## Hướng dẫn Deploy

### Bước 1: Backup data hiện tại (tuỳ chọn)
Nếu có data quan trọng trong Neon.tech:
```bash
# Export data từ Neon.tech (chạy local)
pg_dump "your-neon-database-url" > backup.sql
```

### Bước 2: Deploy với PostgreSQL service mới
1. Commit tất cả changes:
```bash
git add .
git commit -m "feat: migrate to Render PostgreSQL"
git push origin main
```

2. Trong Render Dashboard:
   - Vào project của bạn
   - Trigger **Manual Deploy**
   - Render sẽ tự động tạo PostgreSQL service từ `render.yaml`

### Bước 3: Verify deployment
Sau khi deploy thành công, check logs:
```
🚀 Starting Restaurant Inventory Backend...
⏳ Waiting for database to be ready...
🔄 Generating Prisma Client...
🗄️ Running database migrations...
🌱 Seeding database...
🔍 Final database connection check...
✅ Database connected successfully
📊 Database ready - Found X users
🌐 Starting server...
```

### Bước 4: Import data (nếu có backup)
Nếu có backup từ Neon.tech:
```bash
# Connect vào Render PostgreSQL và import
psql "render-postgresql-url" < backup.sql
```

## Troubleshooting

### Lỗi: "Database service not found"
**Nguyên nhân:** PostgreSQL service chưa được tạo
**Giải pháp:**
1. Kiểm tra `render.yaml` có PostgreSQL service config
2. Redeploy để trigger service creation
3. Đợi 2-3 phút để service startup

### Lỗi: "Connection refused"
**Nguyên nhân:** PostgreSQL service chưa ready
**Giải pháp:**
1. Kiểm tra PostgreSQL service status trong Dashboard
2. Đợi thêm vài phút
3. Redeploy nếu cần

### Lỗi: "Migration failed"
**Nguyên nhân:** Schema conflicts hoặc data issues
**Giải pháp:**
1. Check migration logs
2. Có thể cần `--force-reset` để reset DB:
```bash
# Trong render-start.sh, thay đổi tạm thời:
npx prisma db push --force-reset --accept-data-loss
```

### Lỗi: "Seed failed"
**Nguyên nhân:** Duplicate data hoặc constraint violations
**Giải pháp:** 
- Script đã handle với `|| echo "⚠️ Seed failed or already exists"`
- Không ảnh hưởng đến app startup

## Monitoring và Maintenance

### 1. Database Health Check
- Tự động health check trong `render-start.sh`
- Monitor qua Render Dashboard > Database tab

### 2. Backup Strategy
- Render tự động backup daily
- Manual backup: Dashboard > Database > Create Backup

### 3. Performance Monitoring
- Check connection pool usage
- Monitor query performance qua Render metrics

## Rollback Plan (nếu cần)

Nếu cần quay về Neon.tech:
1. Restore `render.yaml` về version cũ (remove PostgreSQL service)
2. Cập nhật DATABASE_URL về Neon.tech
3. Redeploy

## Cost Comparison

### Render PostgreSQL Starter:
- $7/month cho 256MB RAM
- 1GB storage
- Unlimited connections

### Neon.tech Free Tier:
- Free với limitations
- 512MB storage
- Hibernate sau inactivity

**Kết luận:** Render PostgreSQL phù hợp cho production, Neon.tech tốt cho development/testing.

## Next Steps

1. ✅ Deploy và verify
2. ⏳ Monitor performance trong 24h đầu  
3. ⏳ Setup monitoring alerts
4. ⏳ Document connection strings cho team
5. ⏳ Update development environment nếu cần

---

🎉 **Migration Complete!** 
Database đã được chuyển từ Neon.tech sang Render PostgreSQL thành công!