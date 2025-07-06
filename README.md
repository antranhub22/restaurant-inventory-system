# Restaurant Inventory Management System

Hệ thống quản lý kho nhà hàng với khả năng OCR xử lý hóa đơn và theo dõi đối soát thời gian thực cho các nhà hàng Việt Nam.

## 🚀 Deployment trên Render

### Bước 1: Chuẩn bị
1. Đảm bảo code đã được push lên GitHub
2. Tạo tài khoản trên [Render.com](https://render.com)

### Bước 2: Tạo Database
1. Vào Render Dashboard → New → PostgreSQL
2. Chọn plan phù hợp (Starter cho development)
3. Ghi nhớ thông tin kết nối database

### Bước 3: Deploy Backend
1. Vào Render Dashboard → New → Web Service
2. Connect với GitHub repository
3. Cấu hình:
   - **Name**: `restaurant-inventory-backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```bash
     cd backend
     npm install
     npx prisma generate
     npx prisma migrate deploy
     npm run build
     ```
   - **Start Command**: 
     ```bash
     cd backend
     npm run start:prod
     ```

4. Thêm Environment Variables:
   - `DATABASE_URL`: URL từ PostgreSQL service
   - `JWT_SECRET`: Một chuỗi bí mật ngẫu nhiên
   - `NODE_ENV`: `production`
   - `PORT`: `3000`

### Bước 4: Deploy Frontend
1. Vào Render Dashboard → New → Static Site
2. Connect với GitHub repository
3. Cấu hình:
   - **Name**: `restaurant-inventory-frontend`
   - **Build Command**: 
     ```bash
     cd backend/frontend
     npm install
     npm run build
     ```
   - **Publish Directory**: `backend/frontend/dist`
   - **Environment Variable**: `VITE_API_URL` = URL của backend service

### Bước 5: Cập nhật CORS
1. Vào Backend service settings
2. Thêm Environment Variable: `FRONTEND_URL` = URL của frontend service

## 🛠️ Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd backend/frontend
npm install
npm run dev
```

## 📊 Tính năng chính

- 📱 Giao diện mobile-first responsive
- 🔍 OCR xử lý hóa đơn với Google Vision API
- 📈 Dashboard báo cáo thời gian thực
- 🔐 Xác thực và phân quyền người dùng
- 📊 Xuất báo cáo PDF/Excel/CSV
- 🌐 Hỗ trợ tiếng Việt

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript + PostgreSQL + Redis
- **OCR**: Google Vision API + OpenAI
- **State Management**: Zustand + React Query
- **Testing**: Jest + React Testing Library + Playwright

## 📝 Ghi chú

- Đảm bảo database đã được migrate và seeded trước khi deploy
- Kiểm tra các environment variables đã được cấu hình đúng
- Monitor logs để debug nếu có lỗi
