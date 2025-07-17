# 🔧 Hướng dẫn Fix Database Connection trên Render

## ⚠️ Vấn đề hiện tại
```
Error: P1001: Can't reach database server at 'dpg-d11spnvfte5s73dtqok0-a:5432'
```

## 🎯 Giải pháp nhanh

### Bước 1: Tạo PostgreSQL Database trên Render

1. **Đăng nhập Render Dashboard**: https://dashboard.render.com
2. **Tạo Database Service**:
   - Click "New" → "PostgreSQL"
   - Name: `restaurant-inventory-db`
   - Plan: **Free**
   - Region: **Chọn cùng region với backend service**
   - Database Name: `restaurant_inventory`
   - Username: (auto-generated)

### Bước 2: Copy DATABASE_URL

1. **Vào database service vừa tạo**
2. **Tab "Connect"** → Copy **Internal Database URL**
3. **Format**: `postgresql://username:password@dpg-xxx-a:5432/database_name`

⚠️ **Quan trọng**: Sử dụng **Internal URL**, không phải External URL

### Bước 3: Cập nhật Backend Environment

1. **Vào backend service** (restaurant-inventory-backend)
2. **Tab "Environment"**
3. **Thêm/Cập nhật variables**:

```env
DATABASE_URL=postgresql://restaurant_user:password@dpg-xxx-a:5432/restaurant_inventory
NODE_ENV=production
JWT_SECRET=your-secure-secret-key-here
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key
FRONTEND_URL=https://your-frontend.onrender.com
PORT=10000
```

### Bước 4: Deploy lại Backend

1. **Manual Deploy**:
   - Vào backend service
   - Click "Manual Deploy" → "Deploy latest commit"

2. **Theo dõi Logs**:
   - Click "Logs" tab
   - Tìm thông báo:
   ```
   🔄 Testing database connection...
   ✅ Database connected successfully
   📊 Database ready - Found X users
   ```

## 📊 Kiểm tra thành công

### Logs thành công:
```
🔄 Building application...
📦 Generating Prisma Client...
🗄️ Setting up database...
🌱 Seeding database...
🏗️ Building TypeScript...
🔍 Checking database connection...
✅ Database connected successfully
📊 Database ready - Found 1 users
✅ Backend build completed!

🚀 Starting Restaurant Inventory Backend...
🔍 Checking database connection...
✅ Database connection successful!
🌐 Starting server...
🚀 Server running on port 10000
```

### Test Backend:
Truy cập: `https://your-backend.onrender.com/api/items`

## 🚨 Troubleshooting

### Lỗi "Can't reach database server"
```bash
# Kiểm tra:
1. Database service có đang chạy không
2. Backend và Database cùng region không
3. DATABASE_URL format đúng không
4. Restart backend service
```

### Lỗi "Authentication failed"
```bash
# Giải pháp:
1. Copy lại Internal Database URL từ Render
2. Paste chính xác vào DATABASE_URL
3. Không edit URL manually
```

### Lỗi "Database schema not found"
```bash
# Chạy manual:
npx prisma db push
npx prisma db seed
```

## 📋 Checklist

- [ ] Database service đã tạo và running
- [ ] DATABASE_URL sử dụng Internal URL
- [ ] Backend service cùng region với database
- [ ] Environment variables đã cập nhật
- [ ] Deploy thành công
- [ ] Logs hiển thị database connected
- [ ] API endpoint response thành công

## 🔍 Debug Commands

### Local testing:
```bash
cd backend
npm run db:check
npm run db:setup
npm start
```

### Render Service Settings:
```
Build Command: ./render-build.sh
Start Command: ./render-start.sh
Environment: Production
Auto-Deploy: Yes
```

## 📞 Support

Nếu vẫn gặp lỗi, kiểm tra:
1. Render service status
2. Database connection logs
3. Environment variables spelling
4. Region compatibility

**Thời gian deploy**: ~3-5 phút
**Database initialization**: ~1-2 phút