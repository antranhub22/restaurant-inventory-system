# 🍽️ Restaurant Inventory Management System

Hệ thống quản lý kho nhà hàng với khả năng OCR để xử lý hóa đơn và phiếu kho tự động.

## 🚀 Tính năng chính

- **OCR Processing**: Trích xuất thông tin từ hóa đơn/phiếu kho bằng AI
- **Form Mapping**: Tự động map dữ liệu OCR vào các form nghiệp vụ
- **Real-time Reconciliation**: Theo dõi đối soát kho theo thời gian thực
- **Multi-form Support**: Hỗ trợ Import, Export, Return, Adjustment, Waste
- **Vietnamese Language**: Giao diện và xử lý tiếng Việt
- **Mobile Responsive**: Tối ưu cho thiết bị di động

## 🛠️ Tech Stack

### Backend
- **Node.js** + **TypeScript** + **Express**
- **PostgreSQL** (Neon.tech) + **Prisma ORM**
- **Redis** cho caching và session
- **Tesseract.js** cho OCR
- **OpenAI** cho AI matching
- **JWT** authentication

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** cho styling
- **React Router** cho routing
- **Zustand** cho state management
- **React Query** cho data fetching

## 📋 Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- PostgreSQL database (Neon.tech)
- Redis server

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd restaurant-inventory-system
```

### 2. Cài đặt dependencies
```bash
npm run install:all
```

### 3. Cấu hình môi trường

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Cập nhật `.env` với thông tin database:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="your-openai-key"
```

#### Frontend (.env)
```bash
cd frontend
cp .env.example .env
```

Cập nhật `.env`:
```env
VITE_API_URL=http://localhost:3000
```

### 4. Setup database
```bash
npm run setup
```

### 5. Chạy development
```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng lẻ
npm run dev:backend  # Backend trên port 3000
npm run dev:frontend # Frontend trên port 5173
```

## 📱 Sử dụng hệ thống

### 1. Đăng nhập
- Truy cập: http://localhost:5173
- Email: `admin@restaurant.com`
- Password: `password123`

### 2. OCR Processing
1. Chọn ảnh hóa đơn/phiếu kho
2. Chọn loại phiếu (Import/Export/Return/Adjustment/Waste)
3. Nhấn "Xử lý OCR"
4. Kiểm tra và chỉnh sửa kết quả
5. Xác nhận để lưu vào hệ thống

### 3. Quản lý Form Templates
- Truy cập: http://localhost:5173/admin/form-templates
- Tạo và quản lý các template form

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/test` - Test authentication

### OCR Forms
- `POST /api/ocr-forms/process` - Xử lý OCR
- `POST /api/ocr-forms/confirm` - Xác nhận form
- `GET /api/ocr-forms/:id` - Lấy thông tin form

### Form Templates
- `GET /api/form-templates` - Lấy danh sách templates
- `POST /api/form-templates` - Tạo template mới
- `PUT /api/form-templates/:id` - Cập nhật template
- `DELETE /api/form-templates/:id` - Xóa template

## 🧪 Testing

```bash
# Test toàn bộ hệ thống
npm test

# Test backend
npm run test:backend

# Test frontend
npm run test:frontend
```

## 📦 Build Production

```bash
# Build toàn bộ
npm run build

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

## 🐳 Docker Deployment

```bash
# Build và chạy với Docker Compose
docker-compose up --build

# Chạy trong background
docker-compose up -d
```

## 📊 Monitoring

### Health Check
- Backend: http://localhost:3000/api/health
- Frontend: http://localhost:5173

### Database
- Prisma Studio: `npx prisma studio`
- Migration status: `npx prisma migrate status`

## 🔒 Security

- JWT authentication với refresh tokens
- Role-based access control
- Input validation với Zod
- SQL injection prevention
- XSS protection
- Rate limiting

## 📈 Performance

- API response < 500ms (95th percentile)
- OCR processing < 30 seconds
- Dashboard load < 3 seconds
- Support 20+ concurrent users

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 🆘 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem thư mục `/docs`
- **Email**: support@restaurant-inventory.com

---

**Made with ❤️ for Vietnamese Restaurants**
