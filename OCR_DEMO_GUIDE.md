# 🧾 Hướng dẫn sử dụng OCR Demo - Restaurant Inventory System

## 📋 Tổng quan

OCR Demo là tính năng xử lý hóa đơn tự động bằng công nghệ OCR (Optical Character Recognition) để trích xuất thông tin từ ảnh hóa đơn và chuyển đổi thành dữ liệu có cấu trúc.

## 🚀 Khởi động hệ thống

### Cách 1: Sử dụng script tự động
```bash
./start-ocr-demo.sh
```

### Cách 2: Khởi động thủ công

#### Bước 1: Khởi động Backend
```bash
cd backend
npm install
npm run dev
```

#### Bước 2: Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Truy cập hệ thống

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 🔐 Đăng nhập

Hệ thống sử dụng authentication để bảo vệ OCR demo. Bạn cần đăng nhập trước khi sử dụng.

### Tài khoản mẫu:
- **Email**: admin@restaurant.com
- **Password**: admin123

## 📱 Sử dụng OCR Demo

### Bước 1: Truy cập OCR Demo
1. Đăng nhập vào hệ thống
2. Chọn "🧾 Xử lý hóa đơn OCR" từ menu bên trái

### Bước 2: Kiểm tra trạng thái kết nối
- Hệ thống sẽ tự động kiểm tra kết nối backend, OCR endpoint và authentication
- Nếu có vấn đề, sẽ hiển thị khuyến nghị khắc phục

### Bước 3: Upload ảnh hóa đơn
1. Chọn file ảnh hóa đơn (JPEG, PNG, WebP)
2. Chọn loại phiếu tương ứng:
   - **Nhập kho**: Hóa đơn nhập hàng từ nhà cung cấp
   - **Xuất kho**: Phiếu xuất kho cho bộ phận
   - **Hoàn kho**: Phiếu hoàn trả hàng
   - **Điều chỉnh**: Báo cáo điều chỉnh kho
   - **Hao hụt**: Báo cáo hao hụt

### Bước 4: Xử lý OCR
1. Nhấn "Xử lý OCR"
2. Hệ thống sẽ:
   - Upload ảnh lên server
   - Xử lý OCR với Tesseract.js
   - Trích xuất thông tin từ ảnh
   - Map dữ liệu vào form tương ứng

### Bước 5: Kiểm tra và chỉnh sửa
1. Xem kết quả trích xuất
2. Kiểm tra độ tin cậy (confidence) của từng trường
3. Chỉnh sửa thông tin nếu cần
4. Xác nhận để lưu vào hệ thống

## 🔧 Tính năng OCR

### Hỗ trợ định dạng ảnh
- JPEG, PNG, WebP
- Kích thước tối đa: 10MB
- Độ phân giải tối thiểu: 300 DPI

### Loại hóa đơn hỗ trợ
1. **Hóa đơn máy in** (độ chính xác >95%)
   - Font chữ đều đặn
   - Bố cục rõ ràng
   - Độ tương phản cao

2. **Hóa đơn viết tay** (độ chính xác >85%)
   - Chữ viết tay rõ ràng
   - Cần kiểm tra thủ công

3. **Hóa đơn hỗn hợp**
   - Kết hợp in và viết tay
   - Xử lý theo từng vùng

### Thông tin trích xuất
- **Thông tin chung**:
  - Ngày hóa đơn
  - Số hóa đơn
  - Nhà cung cấp
  - Tổng tiền
  - Ghi chú

- **Danh sách mặt hàng**:
  - Tên hàng hóa
  - Số lượng
  - Đơn vị
  - Đơn giá
  - Thành tiền

## 🛠️ Xử lý sự cố

### Lỗi kết nối Backend
```
❌ Backend: Không thể kết nối đến backend
```
**Khắc phục**:
1. Kiểm tra backend có đang chạy không
2. Kiểm tra port 3000 có bị chiếm không
3. Khởi động lại backend server

### Lỗi OCR Endpoint
```
❌ OCR Endpoint: Endpoint không tồn tại
```
**Khắc phục**:
1. Kiểm tra OCR routes có được đăng ký đúng không
2. Kiểm tra OCR service có được cài đặt đúng không
3. Restart backend server

### Lỗi Authentication
```
❌ Authentication: Token không hợp lệ
```
**Khắc phục**:
1. Đăng nhập lại để lấy token mới
2. Kiểm tra auth service có hoạt động không

### Lỗi xử lý ảnh
```
❌ Lỗi khi xử lý ảnh
```
**Khắc phục**:
1. Kiểm tra định dạng ảnh có được hỗ trợ không
2. Kiểm tra kích thước ảnh có quá lớn không
3. Thử với ảnh khác

## 📊 Hiệu suất OCR

### Độ chính xác theo loại hóa đơn
- **Hóa đơn máy in**: >95%
- **Hóa đơn viết tay**: >85%
- **Hóa đơn hỗn hợp**: >88%

### Thời gian xử lý
- **Ảnh nhỏ (<1MB)**: <10 giây
- **Ảnh trung bình (1-5MB)**: 10-20 giây
- **Ảnh lớn (5-10MB)**: 20-30 giây

## 🔍 Debug và Logs

### Backend Logs
```bash
cd backend
npm run dev
```
Logs sẽ hiển thị:
- Request/Response details
- OCR processing steps
- Error messages

### Frontend Console
Mở Developer Tools (F12) để xem:
- Network requests
- JavaScript errors
- OCR processing status

## 📝 Ví dụ sử dụng

### Hóa đơn nhập hàng mẫu
```
CHỢ BẾN THÀNH
Địa chỉ: Quận 1, TP.HCM
ĐT: 0901234567

HÓA ĐƠN BÁN HÀNG
Ngày: 02/07/2025
Số: 001234

Thịt bò úc        2.5kg    625.000
Cà chua          1.0kg     35.000
Rau muống        3 bó      45.000

Tổng cộng:              705.000 VND
```

### Kết quả trích xuất mong đợi
```json
{
  "fields": [
    {"name": "date", "value": "2025-07-02", "confidence": 0.98},
    {"name": "invoice_no", "value": "001234", "confidence": 0.95},
    {"name": "supplier", "value": "Chợ Bến Thành", "confidence": 0.92},
    {"name": "total", "value": 705000, "confidence": 0.96}
  ],
  "items": [
    {"name": "Thịt bò úc", "quantity": 2.5, "unit": "kg", "price": 250000, "total": 625000, "confidence": 0.94},
    {"name": "Cà chua", "quantity": 1.0, "unit": "kg", "price": 35000, "total": 35000, "confidence": 0.91},
    {"name": "Rau muống", "quantity": 3, "unit": "bó", "price": 15000, "total": 45000, "confidence": 0.89}
  ]
}
```

## 🎯 Lưu ý quan trọng

1. **Chất lượng ảnh**: Ảnh càng rõ nét, độ chính xác càng cao
2. **Góc chụp**: Chụp thẳng góc, tránh bị nghiêng
3. **Ánh sáng**: Đảm bảo đủ ánh sáng, tránh bóng mờ
4. **Kiểm tra kết quả**: Luôn kiểm tra và chỉnh sửa kết quả OCR
5. **Backup dữ liệu**: Lưu trữ ảnh gốc để tham khảo sau này

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs backend và frontend
2. Thử với ảnh khác
3. Kiểm tra kết nối mạng
4. Liên hệ team phát triển

---

**Phiên bản**: 1.0.0  
**Cập nhật**: 2025-01-07  
**Tác giả**: Restaurant Inventory System Team