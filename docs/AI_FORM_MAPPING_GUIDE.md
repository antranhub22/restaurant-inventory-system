# Hướng dẫn AI Form Mapping

## Tổng quan

Tính năng AI Form Mapping cho phép hệ thống sử dụng OpenAI hoặc DeepSeek để phân tích nội dung OCR một cách thông minh và mapping vào các form mẫu. Thay vì sử dụng các thuật toán mapping cứng như trước, AI sẽ hiểu ngữ cảnh và đưa ra quyết định mapping phù hợp hơn.

## Cấu hình

### 1. Biến môi trường

Trong file `.env`, thêm các cấu hình sau:

```env
# AI Services
AI_SERVICE="openai"  # hoặc "deepseek"
OPENAI_API_KEY="your-openai-api-key"
DEEPSEEK_API_KEY="your-deepseek-api-key"
```

### 2. Fallback Mechanism (Mới!)

- **OpenAI** (Primary): Sử dụng model `gpt-4o-mini` - Độ chính xác cao
- **DeepSeek** (Fallback): Sử dụng model `deepseek-chat` - Backup khi OpenAI lỗi
- **Traditional Mapping** (Final): Rule-based matching khi cả 2 AI lỗi

**Logic Fallback**: OpenAI → DeepSeek → Traditional → Error

## Tính năng

### 1. Phân tích thông minh

AI sẽ phân tích nội dung OCR dựa trên:
- Ngữ cảnh nghiệp vụ (nhà hàng Việt Nam)
- Loại form (nhập kho, xuất kho, hoàn trả, điều chỉnh)
- Vị trí và mối quan hệ giữa các thông tin
- Các alias phổ biến trong ngành F&B

### 2. Mapping linh hoạt

Thay vì mapping cứng theo vị trí, AI có thể:
- Hiểu đồng nghĩa và biến thể tiếng Việt
- Xử lý các format hóa đơn khác nhau
- Đưa ra quyết định dựa trên logic nghiệp vụ
- Đánh giá độ tin cậy một cách thông minh

### 3. Fallback an toàn

Nếu AI service không khả dụng:
- Hệ thống tự động chuyển về phương pháp mapping cũ
- Không ảnh hưởng đến hoạt động của ứng dụng
- Ghi log để theo dõi

## Cách hoạt động

### 1. Flow xử lý với Fallback

```
OCR Extract → Try OpenAI → (Fail?) → Try DeepSeek → (Fail?) → Traditional → Form Mapping → User Review → Confirm
```

### 2. AI Prompt Structure

**System Prompt**: Định nghĩa vai trò AI là chuyên gia phân tích hóa đơn nhà hàng
**User Prompt**: Cung cấp nội dung OCR với độ tin cậy từng dòng

### 3. Response Format

AI trả về JSON với cấu trúc:
```json
{
  "fields": [
    {
      "name": "date",
      "value": "2024-01-15",
      "confidence": 0.95,
      "needsReview": false
    }
  ],
  "items": [
    {
      "name": "Thịt bò",
      "quantity": 5,
      "unit": "kg",
      "price": 200000,
      "total": 1000000,
      "confidence": 0.9,
      "needsReview": false
    }
  ],
  "confidence": 0.85,
  "reasoning": "Giải thích cách phân tích"
}
```

## Ưu điểm so với phương pháp cũ

### 1. Hiểu ngữ cảnh tốt hơn
- **Cũ**: Match theo keyword cứng
- **Mới**: Hiểu ý nghĩa và ngữ cảnh

### 2. Xử lý đa dạng input
- **Cũ**: Chỉ xử lý được format quen thuộc
- **Mới**: Thích ứng với nhiều format khác nhau

### 3. Độ chính xác cao hơn
- **Cũ**: Dựa vào vị trí và pattern matching
- **Mới**: Kết hợp logic nghiệp vụ và AI reasoning

### 4. Dễ bảo trì và mở rộng
- **Cũ**: Cần code thêm cho mỗi trường hợp mới
- **Mới**: AI tự học và thích ứng

## Monitoring và Debug

### 1. Logs

Hệ thống ghi log chi tiết:
```
[AI Form Mapper] Bắt đầu xử lý với AI
[AI Form Mapper] Kết quả phân tích AI
[AI Form Mapper] Kết quả cuối cùng
```

### 2. Fallback logs

Khi fallback về phương pháp cũ:
```
Không có AI provider, fallback về formContentMatcherService
```

### 3. Error handling

- Lỗi AI API được catch và fallback
- Lỗi parsing JSON được xử lý gracefully
- Timeout được set phù hợp (30s)

## Best Practices

### 1. Cấu hình AI Service

- Sử dụng OpenAI cho độ chính xác cao
- Sử dụng DeepSeek cho tiết kiệm chi phí
- Luôn có API key backup

### 2. Monitoring chi phí

- Theo dõi usage qua dashboard provider
- Set limit phù hợp với ngân sách
- Optimize prompt để giảm token

### 3. Kiểm tra quality

- Review kết quả AI thường xuyên
- Thu thập feedback từ user
- Điều chỉnh prompt khi cần

## Troubleshooting

### 1. AI không hoạt động

```bash
# Kiểm tra API key
echo $OPENAI_API_KEY

# Kiểm tra network
curl -I https://api.openai.com/v1/models

# Xem logs
tail -f logs/app.log | grep "AI Form Mapper"
```

### 2. Kết quả không chính xác

- Kiểm tra quality của OCR input
- Review AI reasoning trong response
- Điều chỉnh confidence threshold
- Cung cấp thêm context trong prompt

### 3. Chi phí cao

- Optimize prompt length
- Cache kết quả cho input tương tự
- Sử dụng model nhỏ hơn (gpt-3.5-turbo)
- Set rate limiting

## Migration từ hệ thống cũ

### 1. Zero downtime

- AI system chạy song song với hệ thống cũ
- Fallback tự động khi AI lỗi
- Không cần thay đổi database

### 2. A/B Testing

- So sánh kết quả AI vs cũ
- Đánh giá accuracy và user satisfaction
- Điều chỉnh dần phần trăm sử dụng AI

### 3. Backup strategy

- Luôn giữ code cũ làm backup
- Monitor error rate
- Rollback nhanh khi cần

## Roadmap

### Phase 1 (Hiện tại)
- ✅ Tích hợp OpenAI và DeepSeek
- ✅ Fallback mechanism
- ✅ Basic form mapping

### Phase 2 (Tiếp theo)
- 🔄 Fine-tune prompt cho từng loại hóa đơn
- 🔄 Cache intelligent để giảm chi phí
- 🔄 Batch processing cho multiple forms

### Phase 3 (Tương lai)
- 📅 Custom model training
- 📅 Multi-modal processing (image + text)
- 📅 Real-time learning từ user corrections