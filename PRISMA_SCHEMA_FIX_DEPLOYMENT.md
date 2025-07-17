# Prisma Schema Fix for Render Deployment

## Vấn đề
Khi deploy trên Render, ứng dụng gặp lỗi:
- `Error: Could not find Prisma Schema that is required for this command`
- Lỗi xảy ra khi chạy migrations với `npx prisma db push`
- Prisma không tìm thấy file schema.prisma dù file tồn tại

## Nguyên nhân
1. **Working directory không đúng**: Khi Render chạy commands, working directory có thể khác với cấu trúc local
2. **Path resolution**: Prisma tìm schema ở relative path nhưng working directory không khớp
3. **Build vs Runtime**: Schema được copy vào dist/ nhưng Prisma vẫn tìm ở vị trí gốc

## Giải pháp đã áp dụng

### 1. Cập nhật render-build.sh
```bash
# Copy Prisma schema to dist directory
mkdir -p dist/prisma
cp -r prisma/* dist/prisma/
```

### 2. Tạo fix-prisma-path.sh
Script này tự động:
- Detect đúng working directory
- Set PRISMA_SCHEMA_PATH environment variable
- Generate Prisma client với đúng path
- Run migrations nếu cần

### 3. Cập nhật render-start.sh
Thêm logic để:
- Change directory trước khi run Prisma commands
- Specify schema path explicitly với --schema flag
- Fallback multiple schema locations

### 4. Environment Variables
Thêm vào .env:
```
PRISMA_SCHEMA_PATH="./prisma/schema.prisma"
```

## Cách deploy trên Render

### Option 1: Sử dụng Docker (Recommended)
```yaml
# render.yaml
services:
  - type: web
    name: restaurant-inventory-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
```

### Option 2: Node.js runtime với fixes
```yaml
services:
  - type: web
    name: restaurant-inventory-backend
    runtime: node
    buildCommand: cd backend && ./render-build.sh
    startCommand: cd backend && ./fix-prisma-path.sh && ./render-start.sh
```

## Kiểm tra và Debug

### 1. Verify schema location
```bash
find . -name "schema.prisma" -type f
```

### 2. Test Prisma generation
```bash
cd backend
./fix-prisma-path.sh
```

### 3. Check logs trên Render
- Xem logs để confirm working directory
- Verify DATABASE_URL được set
- Check migration output

## Lưu ý quan trọng
1. **Database URL**: Đảm bảo DATABASE_URL được set trong Render environment
2. **Build order**: Prisma generate phải chạy SAU khi copy schema
3. **Path consistency**: Luôn use relative paths từ backend directory
4. **Fallback logic**: Có multiple fallback paths để handle different scenarios

## Monitoring
- Check `/api/health` endpoint
- Monitor Render logs cho Prisma errors
- Verify database tables được tạo đúng