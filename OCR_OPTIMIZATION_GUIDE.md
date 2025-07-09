# 🚀 Hướng dẫn tối ưu hóa OCR với Google Cloud Vision API

## 📋 Tổng quan

Hệ thống đã được tối ưu hóa để sử dụng **Google Cloud Vision API** làm giải pháp OCR chính và **Tesseract** làm fallback, đặc biệt tối ưu cho hóa đơn nhà hàng tiếng Việt.

## 🎯 Các tối ưu hóa chính

### 1. 🔧 Tối ưu hóa Google Cloud Vision API

#### Cấu hình Vision API
```typescript
// Tối ưu hóa cho tiếng Việt
const visionConfig = {
  languageHints: ['vi', 'en'], // Ưu tiên tiếng Việt
  productSearchParams: {
    productCategories: ['receipt', 'invoice', 'document'],
    filter: 'category=receipt'
  },
  textDetectionParams: {
    enableTextDetectionConfidenceScore: true,
    advancedOcrOptions: {
      useAdvancedOcr: true
    }
  }
};
```

#### Timeout và Retry
- **Vision API Timeout**: 30 giây
- **Tesseract Timeout**: 60 giây
- **Retry Attempts**: 3 lần
- **Fallback**: Tự động chuyển sang Tesseract nếu Vision API thất bại

### 2. 🖼️ Tối ưu hóa ảnh trước OCR

#### Image Processing Pipeline
```typescript
// 1. Tăng độ tương phản và độ sắc nét
.modulate({
  brightness: 1.1,    // Tăng độ sáng nhẹ
  contrast: 1.2,      // Tăng độ tương phản
  saturation: 0.8     // Giảm độ bão hòa
})
.sharpen({
  sigma: 1.5,         // Độ sắc nét
  flat: 1.0,          // Ngưỡng phẳng
  jagged: 2.0         // Ngưỡng răng cưa
})

// 2. Resize tối ưu
.resize(maxWidth, maxHeight, {
  kernel: sharp.kernel.lanczos3,
  fit: 'inside',
  withoutEnlargement: true
})

// 3. Tối ưu hóa cho OCR
.png({ 
  quality: 90,
  compressionLevel: 6,
  adaptiveFiltering: true
})
.removeAlpha()
.flatten({ background: { r: 255, g: 255, b: 255 } })
```

#### Chất lượng ảnh yêu cầu
- **Độ phân giải tối thiểu**: 800x600px
- **Format hỗ trợ**: JPEG, PNG, WebP
- **Kích thước file**: 10KB - 10MB
- **DPI tối thiểu**: 300 DPI

### 3. 🇻🇳 Tối ưu hóa cho tiếng Việt

#### Pattern Detection
```typescript
// Tiền tệ VND
/^\d+([,.]\d+)?\s*(đ|vnd|vnđ|₫)$/i
/^\d+([,.]\d+)?\s*(đồng|dong)$/i
/^\d+([,.]\d+)?\s*(nghìn|ngàn|k)$/i

// Ngày tháng
/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/
/^\d{1,2}\.\d{1,2}\.\d{2,4}$/

// Số lượng
/^\d+([,.]\d+)?\s*(cái|chiếc|bộ|kg|g|ml|l)$/i
```

#### Text Normalization
```typescript
// Chuẩn hóa dấu tiếng Việt
.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
.replace(/[èéẹẻẽêềếệểễ]/g, 'e')
.replace(/[ìíịỉĩ]/g, 'i')
.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
.replace(/[ùúụủũưừứựửữ]/g, 'u')
.replace(/[ỳýỵỷỹ]/g, 'y')
.replace(/[đ]/g, 'd')
```

### 4. 🎯 Tối ưu hóa cho hóa đơn nhà hàng

#### Receipt Keywords Detection
```typescript
const receiptKeywords = [
  'hóa đơn', 'invoice', 'receipt', 'bill',
  'tổng cộng', 'total', 'thanh toán', 'payment',
  'tiền', 'money', 'giá', 'price',
  'số lượng', 'quantity', 'qty', 'sl',
  'đơn giá', 'unit price'
];
```

#### Confidence Scoring
```typescript
// Base confidence: 0.5
// +0.1 cho mỗi element phát hiện được
// +0.2 nếu có header hóa đơn
// +0.1 nếu có ngày tháng
// +0.1 nếu có tiền tệ
// -0.2 nếu text quá ngắn (<50 ký tự)
```

## 📊 Hiệu suất mong đợi

### Độ chính xác
- **Hóa đơn máy in**: >95% accuracy
- **Hóa đơn viết tay**: >85% accuracy
- **Hóa đơn hỗn hợp**: >90% accuracy

### Thời gian xử lý
- **Vision API**: <30 giây
- **Tesseract Fallback**: <60 giây
- **Image Optimization**: <5 giây

### Throughput
- **Concurrent Users**: 20 users
- **Rate Limit**: 30 requests/phút
- **Batch Processing**: 5 images/batch

## 🔧 Cấu hình môi trường

### Production Environment
```bash
# Copy file cấu hình tối ưu
cp backend/env.vision-optimized.example backend/.env

# Cập nhật các biến môi trường
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_CLIENT_EMAIL="your-service-account-email"
GOOGLE_CLOUD_PRIVATE_KEY="your-private-key"

# OCR Configuration
OCR_MIN_CONFIDENCE_SCORE=0.7
OCR_ENABLE_IMAGE_OPTIMIZATION=true
OCR_ENABLE_VIETNAMESE_OPTIMIZATION=true
```

### Development Environment
```bash
# Sử dụng mock Vision client
NODE_ENV=development
# Vision API sẽ được mock trong development
```

## 🚀 Triển khai

### 1. Cài đặt dependencies
```bash
cd backend
npm install sharp @types/sharp
```

### 2. Cấu hình Google Cloud Vision API
```bash
# Tạo service account
gcloud iam service-accounts create ocr-service \
  --display-name="OCR Service Account"

# Gán quyền Vision API
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:ocr-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/ml.developer"

# Tạo key file
gcloud iam service-accounts keys create key.json \
  --iam-account=ocr-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Cập nhật environment variables
```bash
# Trong file .env
GOOGLE_CLOUD_PROJECT_ID="YOUR_PROJECT_ID"
GOOGLE_CLOUD_CLIENT_EMAIL="ocr-service@YOUR_PROJECT_ID.iam.gserviceaccount.com"
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

## 📈 Monitoring và Debugging

### Log Levels
```typescript
// Info level
logger.info('🔍 Bắt đầu xử lý OCR với Google Cloud Vision API...');
logger.info(`✅ Google Vision API thành công - Confidence: ${confidence}`);

// Warning level
logger.warn(`⚠️ Google Vision API thất bại, chuyển sang Tesseract`);

// Error level
logger.error('❌ Lỗi trong quá trình xử lý OCR:', error);
```

### Metrics
- **OCR Success Rate**: Tỷ lệ thành công
- **Processing Time**: Thời gian xử lý trung bình
- **Confidence Score**: Độ tin cậy trung bình
- **Fallback Rate**: Tỷ lệ sử dụng Tesseract

### Debug Mode
```bash
# Bật debug mode
OCR_DEBUG_MODE=true
OCR_LOGGING_LEVEL="debug"
```

## 🔍 Troubleshooting

### Lỗi thường gặp

#### 1. Vision API Authentication Error
```
Error: Missing Google Cloud Vision credentials
```
**Giải pháp**:
- Kiểm tra service account key
- Đảm bảo project ID đúng
- Kiểm tra quyền Vision API

#### 2. Vision API Timeout
```
Error: Vision API timeout
```
**Giải pháp**:
- Tăng timeout trong config
- Kiểm tra kết nối internet
- Giảm kích thước ảnh

#### 3. Low Confidence Score
```
Confidence: 0.3 (thấp)
```
**Giải pháp**:
- Cải thiện chất lượng ảnh
- Kiểm tra ánh sáng khi chụp
- Đảm bảo ảnh rõ nét

#### 4. Vietnamese Text Issues
```
Không nhận diện được tiếng Việt
```
**Giải pháp**:
- Kiểm tra language hints
- Đảm bảo ảnh có độ tương phản tốt
- Sử dụng image optimization

## 📝 Best Practices

### 1. Chụp ảnh hóa đơn
- **Ánh sáng**: Đủ sáng, không bị chói
- **Góc chụp**: Vuông góc với hóa đơn
- **Khoảng cách**: 20-30cm từ camera
- **Độ ổn định**: Giữ camera ổn định

### 2. Xử lý ảnh
- **Format**: JPEG hoặc PNG
- **Kích thước**: 800x600px trở lên
- **Chất lượng**: Không nén quá mức
- **DPI**: Tối thiểu 300 DPI

### 3. Monitoring
- **Logs**: Kiểm tra logs thường xuyên
- **Metrics**: Theo dõi performance metrics
- **Alerts**: Thiết lập alerts cho lỗi
- **Backup**: Backup dữ liệu OCR

## 🎯 Kết luận

Với các tối ưu hóa này, hệ thống OCR sẽ đạt được:
- ✅ **Độ chính xác cao** cho hóa đơn tiếng Việt
- ✅ **Thời gian xử lý nhanh** với Vision API
- ✅ **Fallback reliable** với Tesseract
- ✅ **Image optimization** tự động
- ✅ **Vietnamese pattern detection** chính xác
- ✅ **Monitoring và debugging** đầy đủ

Hệ thống đã sẵn sàng cho production với Google Cloud Vision API làm giải pháp OCR chính!