# 🚀 Hướng dẫn Deploy trên Render

## 📋 Chuẩn bị trước khi deploy

### 1. Setup Database với Neon.tech (Khuyến nghị)
1. Tạo tài khoản tại [neon.tech](https://neon.tech)
2. Tạo project mới (free tier có 1 database)
3. Copy `DATABASE_URL` từ dashboard
   - Format: `postgresql://user:password@host/database?sslmode=require`

### 2. Setup Redis (Tùy chọn)
Có thể sử dụng một trong các dịch vụ sau:
- [Upstash](https://upstash.com) - Free 10,000 commands/day
- [Redis Cloud](https://redis.com) - Free 30MB
- Hoặc bỏ qua nếu không cần caching

### 3. OCR Services (Tùy chọn)
Nếu cần OCR cho hóa đơn:
- Google Cloud Vision API credentials
- OpenAI API key

## 🔧 Deploy với Render

### Cách 1: Deploy qua GitHub (Khuyến nghị)

1. **Push code lên GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Tạo services trên Render**
   - Đăng nhập vào [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect GitHub repo
   - Render sẽ tự động đọc `render.yaml`

3. **Cấu hình Environment Variables**
   
   **Backend Service:**
   - `DATABASE_URL` - Paste từ Neon.tech
   - `JWT_SECRET` - Để Render tự generate
   - `REDIS_URL` - (Optional) từ Redis provider
   - OCR keys nếu cần

   **Frontend Service:**
   - `VITE_API_URL` sẽ tự động set sau khi backend deploy xong

### Cách 2: Deploy thủ công

#### Deploy Backend:
1. Tạo "New Web Service"
2. Connect GitHub repo
3. Cấu hình:
   - **Name**: restaurant-inventory-backend
   - **Runtime**: Node
   - **Build Command**: `cd backend && ./render-build.sh`
   - **Start Command**: `cd backend && ./render-start.sh`
   - **Region**: Singapore
   - **Plan**: Free hoặc Starter

4. Add Environment Variables (như trên)

#### Deploy Frontend:
1. Tạo "New Static Site"
2. Connect GitHub repo
3. Cấu hình:
   - **Name**: restaurant-inventory-frontend
   - **Build Command**: `cd backend/frontend && ./render-build.sh`
   - **Publish Directory**: `backend/frontend/dist`
   - **Region**: Singapore

4. Add Environment Variable:
   - `VITE_API_URL`: `https://[backend-url].onrender.com/api`

## 📝 Post-deployment

### 1. Cập nhật CORS
Sau khi có URL của frontend, update backend environment:
- `FRONTEND_URL`: `https://[frontend-url].onrender.com`

### 2. Test endpoints
```bash
# Health check
curl https://[backend-url].onrender.com/api/health

# Test auth
curl -X POST https://[backend-url].onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

### 3. Seed data (optional)
```bash
# SSH vào backend service hoặc run từ local với production DATABASE_URL
cd backend
DATABASE_URL=your-prod-url npm run prisma:seed
```

## ⚠️ Lưu ý quan trọng

1. **Free tier limitations:**
   - Services sleep sau 15 phút không hoạt động
   - Cold start có thể mất 30-60 giây
   - Giới hạn 750 hours/month

2. **Production considerations:**
   - Enable auto-deploy từ main branch
   - Setup monitoring và alerts
   - Configure custom domain nếu có

3. **Troubleshooting:**
   - Check logs trong Render dashboard
   - Verify DATABASE_URL format
   - Ensure Prisma migrations ran successfully

## 🔐 Security Checklist

- [ ] Đổi JWT_SECRET thành value strong
- [ ] Enable HTTPS (Render tự động)
- [ ] Restrict CORS cho production domain
- [ ] Disable debug logs trong production
- [ ] Setup rate limiting nếu cần

## 📊 Monitoring

Render cung cấp:
- Logs viewer
- Metrics (CPU, Memory, Disk)
- Health check monitoring
- Deploy notifications

## 💡 Tips

1. **Optimize build time:**
   - Sử dụng `npm ci` thay vì `npm install`
   - Cache dependencies nếu có thể

2. **Database performance:**
   - Neon.tech có connection pooling built-in
   - Monitor slow queries

3. **Cost optimization:**
   - Frontend static site là free
   - Backend có thể dùng free tier cho MVP
   - Upgrade khi cần scale

## 🆘 Support

- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- Project Issues: GitHub repo

---

**Happy Deploying! 🎉**