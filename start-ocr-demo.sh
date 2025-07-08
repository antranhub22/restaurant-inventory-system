#!/bin/bash

echo "🚀 Khởi động Restaurant Inventory System - OCR Demo"
echo "=================================================="

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt. Vui lòng cài đặt Node.js trước."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Kiểm tra npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm chưa được cài đặt. Vui lòng cài đặt npm trước."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Tạo thư mục uploads nếu chưa có
mkdir -p backend/uploads

# Kiểm tra database
echo "🔍 Kiểm tra database..."
cd backend
if [ ! -f ".env" ]; then
    echo "⚠️  File .env chưa tồn tại. Tạo file .env từ env.example..."
    cp env.example .env
    echo "📝 Vui lòng cập nhật thông tin database trong file .env"
fi

# Cài đặt dependencies backend
echo "📦 Cài đặt dependencies backend..."
npm install

# Chạy database migrations
echo "🗄️  Chạy database migrations..."
npx prisma migrate deploy

# Khởi động backend trong background
echo "🔧 Khởi động backend server..."
npm run dev &
BACKEND_PID=$!

# Đợi backend khởi động
echo "⏳ Đợi backend khởi động..."
sleep 5

# Kiểm tra backend có chạy không
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend đã khởi động thành công"
else
    echo "❌ Backend khởi động thất bại"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Chuyển sang frontend
cd ../frontend

# Cài đặt dependencies frontend
echo "📦 Cài đặt dependencies frontend..."
npm install

# Khởi động frontend
echo "🎨 Khởi động frontend..."
echo "🌐 Frontend sẽ chạy tại: http://localhost:5173"
echo "🔧 Backend đang chạy tại: http://localhost:3000"
echo ""
echo "📋 Hướng dẫn sử dụng OCR Demo:"
echo "1. Mở trình duyệt và truy cập: http://localhost:5173"
echo "2. Đăng nhập với tài khoản mẫu"
echo "3. Chọn 'Xử lý hóa đơn OCR' từ menu"
echo "4. Upload ảnh hóa đơn và test OCR"
echo ""
echo "🛑 Để dừng, nhấn Ctrl+C"

# Đợi người dùng dừng
wait $BACKEND_PID