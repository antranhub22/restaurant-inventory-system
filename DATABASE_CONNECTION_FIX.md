# Sửa lỗi kết nối Database trên Render

## Vấn đề hiện tại
Ứng dụng đang cố kết nối tới PostgreSQL service của Render (`dpg-dilspnvfte5s73dtqok0-a:5432`) thay vì Neon.tech database.

## Cách khắc phục

### Bước 1: Kiểm tra Render Dashboard
1. Vào Render Dashboard của bạn
2. Tìm service `restaurant-inventory-backend`
3. Vào **Settings** > **Environment**
4. Kiểm tra biến `DATABASE_URL`

### Bước 2: Xóa PostgreSQL Service (nếu có)
1. Trong Render Dashboard, kiểm tra danh sách services
2. Nếu thấy một PostgreSQL service tên `restaurant-inventory-backend-db` hoặc tương tự
3. **XÓA** service đó vì chúng ta sử dụng Neon.tech

### Bước 3: Cập nhật DATABASE_URL
1. Vào Neon.tech dashboard của bạn
2. Copy DATABASE_URL (định dạng: `postgresql://user:password@host/database?sslmode=require`)
3. Trong Render service settings, cập nhật `DATABASE_URL` với URL từ Neon

### Bước 4: Verify DATABASE_URL format
DATABASE_URL từ Neon phải có định dạng:
```
postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/restaurant_inventory?sslmode=require
```

### Bước 5: Redeploy
1. Sau khi cập nhật DATABASE_URL, trigger deploy lại
2. Hoặc vào **Manual Deploy** > **Deploy Latest Commit**

## Kiểm tra thành công
Sau khi deploy, logs sẽ hiển thị:
```
✅ Database connected successfully
📊 Database ready - Found X users
```

## Troubleshooting

### Nếu vẫn lỗi "Can't reach database server"
1. Kiểm tra lại DATABASE_URL có đúng format không
2. Đảm bảo có `?sslmode=require` ở cuối URL
3. Verify Neon database vẫn đang chạy

### Nếu lỗi "Auth failed"
1. Kiểm tra username/password trong DATABASE_URL
2. Reset password trong Neon dashboard nếu cần

### Debug Environment Variables
Thêm vào đầu server.ts để debug:
```typescript
console.log('=== DEBUG ENV ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20));
console.log('=================');
```

## Lưu ý quan trọng
- **KHÔNG** tạo PostgreSQL service trong Render khi dùng Neon.tech
- Luôn có `?sslmode=require` trong DATABASE_URL cho production
- Neon.tech free tier có giới hạn connection, nên cấu hình connection pool phù hợp