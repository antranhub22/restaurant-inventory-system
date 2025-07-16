# Hướng Dẫn Triển Khai trên Render.com

## Yêu Cầu
- Tài khoản Render.com
- Git repository của dự án
- Node.js và npm đã cài đặt (để test locally)

## Bước 1: Thiết Lập PostgreSQL trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Chọn "New +" > "PostgreSQL"
3. Điền thông tin database:
   - Name: restaurant-inventory-db
   - Database: restaurant_inventory
   - User: (để Render tự động tạo)
   - Region: Chọn region gần nhất
4. Click "Create Database"
5. **Lưu lại thông tin kết nối**:
   - Internal Database URL: Dùng cho services trong cùng Render
   - External Database URL: Dùng cho kết nối từ bên ngoài

## Bước 2: Thiết Lập Environment Variables

Trong Render Dashboard, thiết lập các biến môi trường:

- `DATABASE_URL`: Copy Internal Database URL từ PostgreSQL instance
- `REDIS_HOST`: Redis host của bạn
- `REDIS_PORT`: Port của Redis (mặc định 6379)
- `REDIS_PASSWORD`: Mật khẩu Redis (nếu có)
- `JWT_SECRET`: Secret key cho JWT
- `FRONTEND_URL`: URL của frontend app
- Các biến môi trường khác theo env.example

## Bước 3: Deploy Backend Service

1. Chọn "New +" > "Web Service"
2. Kết nối với Git repository
3. Cấu hình:
   - Name: restaurant-inventory-backend
   - Root Directory: backend
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `./render-start.sh`
4. Click "Create Web Service"

## Bước 4: Deploy Frontend Service

1. Chọn "New +" > "Static Site"
2. Kết nối với Git repository
3. Cấu hình:
   - Name: restaurant-inventory-frontend
   - Root Directory: frontend
   - Build Command: `npm install && npm run build`
   - Publish Directory: dist

## Kiểm Tra và Theo Dõi

### Kiểm Tra Kết Nối Database
```bash
# Test kết nối tới database
npx prisma db execute --url YOUR_DATABASE_URL --command "SELECT 1;"
```

### Theo Dõi Logs
- Xem logs trong Render Dashboard
- Kiểm tra Events tab của PostgreSQL instance
- Sử dụng `monitor_logs.sh` script

### Giới Hạn và Lưu Ý
- Free tier PostgreSQL: 
  - 1GB storage
  - Shared CPU
  - Tự động backup hàng ngày
- Khuyến nghị upgrade nếu:
  - Cần nhiều hơn 1GB storage
  - Cần dedicated CPU
  - Cần connection limits cao hơn

### Tài Liệu Tham Khảo
- [Render Docs](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

### Troubleshooting

#### Database Connection Issues
1. Kiểm tra DATABASE_URL format
2. Đảm bảo đang dùng Internal Database URL cho services trong Render
3. Kiểm tra firewall và security rules

#### Migration Issues
1. Sử dụng `prisma db push` thay vì migrations trong production
2. Backup data trước khi chạy migrations
3. Test migrations locally trước

#### Performance Optimization
1. Sử dụng connection pooling
2. Implement caching với Redis
3. Optimize queries với Prisma

## Monitoring và Maintenance

### Backup Strategy
- Render tự động backup PostgreSQL daily
- Tải xuống backup định kỳ
- Test restore procedure

### Scaling
1. Upgrade PostgreSQL plan khi cần
2. Sử dụng connection pooling
3. Implement caching hiệu quả
4. Optimize queries và indexes