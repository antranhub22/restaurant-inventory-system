# Render Database Connection Fix Guide

## Vấn đề hiện tại
Lỗi: `Can't reach database server at 'dpg-d11spnvfte5s73dtqok0-a:5432'`

## Nguyên nhân có thể
1. **Database service chưa được tạo hoặc chưa sẵn sàng**
2. **DATABASE_URL format không đúng**
3. **Database và Backend service không cùng region**
4. **Network connectivity issues**

## Giải pháp từng bước

### Bước 1: Kiểm tra Database Service trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Kiểm tra xem PostgreSQL database service đã được tạo chưa
3. Nếu chưa có, tạo mới:
   - Click "New" → "PostgreSQL"
   - Name: `restaurant-inventory-db`
   - Plan: Free (hoặc theo nhu cầu)
   - Region: **Phải cùng region với backend service**

### Bước 2: Lấy DATABASE_URL đúng

1. Vào database service vừa tạo
2. Trong tab "Connect", copy **Internal Database URL**
3. Format sẽ như: `postgresql://username:password@dpg-xxx-a:5432/database_name`

### Bước 3: Cập nhật Environment Variables

Trong backend service:
1. Vào "Environment" tab
2. Cập nhật `DATABASE_URL` với URL từ bước 2
3. **Quan trọng**: Sử dụng Internal URL, không phải External URL

### Bước 4: Khởi tạo Database Schema

Thêm vào `render-build.sh`:
```bash
#!/bin/bash
echo "🔄 Building application..."
npm install

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

echo "🔄 Seeding database..."
npx prisma db seed

echo "✅ Build completed"
```

### Bước 5: Cập nhật package.json

Thêm seed script:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "scripts": {
    "db:check": "node check-database.js",
    "db:setup": "npx prisma db push && npx prisma db seed"
  }
}
```

### Bước 6: Test Database Connection

Chạy script kiểm tra:
```bash
npm run db:check
```

## Environment Variables cần thiết

```env
# Database - Sử dụng Internal URL từ Render
DATABASE_URL="postgresql://username:password@dpg-xxx-a:5432/database_name"

# JWT
JWT_SECRET="your-secure-jwt-secret-here"
JWT_EXPIRES_IN="1d"

# AI Services
OPENAI_API_KEY="your-openai-key"
DEEPSEEK_API_KEY="your-deepseek-key"

# Frontend URL
FRONTEND_URL="https://your-frontend-url.onrender.com"

# Production settings
NODE_ENV="production"
PORT=10000
```

## Troubleshooting

### Lỗi "Can't reach database server"
1. Kiểm tra database service có đang chạy không
2. Verify DATABASE_URL format
3. Đảm bảo cùng region với backend
4. Thử restart backend service

### Lỗi "Authentication failed"
1. Kiểm tra username/password trong DATABASE_URL
2. Copy lại Internal Database URL từ Render

### Lỗi "Database does not exist"
1. Chạy `npx prisma db push`
2. Kiểm tra database name trong URL

### Database schema không có
1. Chạy migrations: `npx prisma db push`
2. Seed data: `npx prisma db seed`

## Logs để kiểm tra

Trong Render logs, tìm:
```
🔄 Testing database connection...
✅ Database connected successfully
📊 Database ready - Found X users
```

Nếu thấy lỗi P1001, check lại DATABASE_URL và database service status.

## Render Service Configuration

### Database Service
- **Name**: restaurant-inventory-db
- **Plan**: Free tier
- **Region**: Same as backend
- **Database Name**: restaurant_inventory
- **Username**: Auto-generated
- **Password**: Auto-generated

### Backend Service
- **Name**: restaurant-inventory-backend
- **Build Command**: `./render-build.sh`
- **Start Command**: `npm start`
- **Environment**: Production
- **Auto-Deploy**: Yes

## Monitoring

Để monitor database:
1. Check database metrics trong Render dashboard
2. Monitor connection logs
3. Set up alerts cho connection failures

## Next Steps

1. ✅ Tạo database service
2. ✅ Cập nhật DATABASE_URL
3. ✅ Deploy với script fix
4. ✅ Test database connection
5. ✅ Verify application functionality