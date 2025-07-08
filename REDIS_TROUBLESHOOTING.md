# Redis Troubleshooting Guide

## Lỗi ECONNREFUSED 127.0.0.1:6379

### Mô tả lỗi
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

Lỗi này xảy ra khi ứng dụng cố gắng kết nối với Redis nhưng:
- Redis server không chạy
- Redis URL không được cấu hình
- Kết nối bị từ chối

### Giải pháp đã áp dụng

Chúng tôi đã cập nhật hệ thống để Redis trở thành **optional** (không bắt buộc). Ứng dụng sẽ hoạt động bình thường mà không cần Redis.

#### 1. RedisService
Đã tạo một service trung tâm để quản lý kết nối Redis:

```typescript
// backend/src/services/redis.service.ts
class RedisService {
  // Kiểm tra Redis có sẵn không
  isAvailable(): boolean
  
  // Các phương thức cache an toàn
  async get(key: string): Promise<string | null>
  async set(key: string, value: string, expiry?: number): Promise<boolean>
  async del(key: string): Promise<boolean>
}
```

#### 2. Service Updates
Tất cả services đã được cập nhật để xử lý trường hợp Redis không khả dụng:

```typescript
// Trước đó
this.redis = new Redis(process.env.REDIS_URL || '');

// Sau khi sửa
this.redis = RedisService.getInstance();
```

### Hoạt động của hệ thống

#### Khi KHÔNG có Redis:
- ✅ Tất cả tính năng hoạt động bình thường
- ⚠️ Hiệu suất có thể chậm hơn một chút
- ℹ️ Log sẽ hiển thị: "Redis URL not configured. Running without Redis cache."

#### Khi CÓ Redis:
- ✅ Cache được kích hoạt cho hiệu suất tốt hơn
- ✅ Giảm tải cho database
- ✅ Response time nhanh hơn

### Cấu hình Redis (Optional)

#### Option 1: Redis Cloud
1. Đăng ký tại [redis.com](https://redis.com)
2. Tạo database free (30MB)
3. Copy connection string
4. Thêm vào Render environment:
   ```
   REDIS_URL=redis://default:password@host:port
   ```

#### Option 2: Upstash
1. Đăng ký tại [upstash.com](https://upstash.com)
2. Tạo Redis database
3. Copy connection string
4. Thêm vào Render environment

#### Option 3: Tiếp tục không dùng Redis
Không cần làm gì cả! Ứng dụng hoạt động tốt mà không cần Redis.

### Kiểm tra trạng thái

Endpoint health check hiển thị trạng thái Redis:

```bash
curl https://your-backend.onrender.com/api/health
```

Response:
```json
{
  "status": "OK",
  "services": {
    "database": "connected",
    "redis": "not configured"  // hoặc "connected" nếu có Redis
  }
}
```

### FAQ

**Q: Có cần phải cấu hình Redis không?**
A: Không bắt buộc. Ứng dụng hoạt động tốt mà không cần Redis.

**Q: Khi nào nên dùng Redis?**
A: Khi có nhiều người dùng đồng thời hoặc cần response time nhanh.

**Q: Redis free tier có đủ không?**
A: Có, 30MB đủ cho hầu hết các restaurant nhỏ và vừa.

**Q: Làm sao biết Redis đang hoạt động?**
A: Check endpoint `/api/health` hoặc xem logs.

### Monitoring

Sử dụng script kiểm tra:
```bash
./check-deployment.sh
```

Hoặc xem logs trong Render Dashboard:
- ✅ "Redis connected successfully"
- ⚠️ "Redis URL not configured"
- ❌ "Redis connection failed"

### Support

Nếu cần hỗ trợ thêm:
1. Tạo issue trên GitHub
2. Kiểm tra logs trong Render Dashboard
3. Liên hệ team development