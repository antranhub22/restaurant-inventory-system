# Render Database Migration Fix

## Vấn đề
Lỗi xuất hiện trong logs của Render:
```
Invalid 'prisma.user.count()' invocation:
The table 'public.User' does not exist in the current database.
```

## Nguyên nhân
1. **DATABASE_URL chưa được set**: Environment variable `DATABASE_URL` không có trong production environment
2. **Database migrations chưa chạy**: Các bảng trong database chưa được tạo từ Prisma schema
3. **Server startup check fail**: Code trong `server.ts` gọi `prisma.user.count()` khi bảng User chưa tồn tại

## Giải pháp áp dụng

### 1. Cải thiện Database Connection Logic
**File: `backend/src/server.ts`**
- ✅ Thêm check `DATABASE_URL` exists trước khi connect
- ✅ Wrap schema validation trong try-catch để handle gracefully
- ✅ Thêm helpful error messages

### 2. Tạo Database Migration Script
**File: `backend/check-and-migrate.js`**
- ✅ Kiểm tra DATABASE_URL environment variable
- ✅ Test database connection
- ✅ Kiểm tra schema và tự động chạy migration nếu cần
- ✅ Verify migration thành công

### 3. Cải thiện Render Start Script
**File: `backend/render-start.sh`**
- ✅ Sử dụng `check-and-migrate.js` thay vì chỉ chạy `prisma migrate deploy`
- ✅ Better error handling và logging

## Cách fix trên Render

### Bước 1: Đảm bảo PostgreSQL Service được kết nối
1. Vào Render Dashboard
2. Tạo PostgreSQL service nếu chưa có
3. Connect PostgreSQL service đến Web Service
4. Verify `DATABASE_URL` environment variable có trong Web Service settings

### Bước 2: Redeploy với code mới
1. Code đã được cải thiện để handle trường hợp này
2. Deploy sẽ tự động chạy migrations
3. Database sẽ được setup automatically

### Bước 3: Kiểm tra logs
Sau khi deploy, check logs để verify:
```
✅ Database connection successful
✅ Database migrations deployed successfully
✅ Database ready - Users: 0
```

## Environment Variables cần thiết trên Render

### Required
- `DATABASE_URL`: Automatically set by PostgreSQL service
- `NODE_ENV`: `production`
- `JWT_SECRET`: Your JWT secret key

### Optional
- `FRONTEND_URL`: URL of your frontend app
- `GOOGLE_CLOUD_PROJECT_ID`: For OCR functionality
- `OPENAI_API_KEY`: For enhanced OCR

## Troubleshooting

### Nếu DATABASE_URL vẫn không có:
1. Check PostgreSQL service status
2. Verify connection between services
3. Restart Web Service

### Nếu migration fail:
1. Check database permissions
2. Verify PostgreSQL service is running
3. Manual migration: Connect to database và chạy SQL từ migration files

### Nếu vẫn có lỗi schema:
1. Check Prisma schema syntax
2. Verify all models are defined correctly
3. Reset database and rerun migrations

## Files thay đổi
- ✅ `backend/src/server.ts` - Improved database connection handling
- ✅ `backend/check-and-migrate.js` - New migration script
- ✅ `backend/render-start.sh` - Enhanced startup process

## Kết quả mong đợi
- ✅ Database connection stable
- ✅ Migrations run automatically
- ✅ Server starts without schema errors
- ✅ Health check endpoint returns 200 OK