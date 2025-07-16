# Deploy Restaurant Inventory System to Render

## Prerequisites
- GitHub account
- Render account (free tier is fine)
- Neon.tech account for PostgreSQL database (free tier)

## Step 1: Database Setup (Neon.tech)

1. Sign up at [https://neon.tech](https://neon.tech)
2. Create a new project
3. Copy the DATABASE_URL (format: `postgresql://user:pass@host/database?sslmode=require`)

## Step 2: Deploy to Render

### Option A: One-Click Deploy
1. Fork this repository to your GitHub account
2. Click the button below:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/restaurant-inventory-system)

3. Fill in required environment variables:
   - `DATABASE_URL`: Your Neon.tech connection string
   - `JWT_SECRET`: Will be auto-generated
   - `REDIS_URL`: (Optional) Redis connection string

### Option B: Manual Deploy

1. Push code to GitHub
2. Sign in to [Render Dashboard](https://dashboard.render.com)
3. Create services according to `render.yaml`

## Step 3: Environment Variables

### Backend (Required)
- `DATABASE_URL`: PostgreSQL connection string from Neon.tech
- `JWT_SECRET`: Auto-generated or custom secret
- `NODE_ENV`: `production`
- `PORT`: `4000` (auto-set by Render)
- `FRONTEND_URL`: Your frontend URL

### Backend (Optional)
- `REDIS_URL`: Redis connection string (see Redis Setup below)
- `GOOGLE_VISION_API_KEY`: For OCR features
- `OPENAI_API_KEY`: For smart matching

### Frontend
- `VITE_API_URL`: Your backend URL (e.g., https://your-backend.onrender.com/api)
- `VITE_ENV`: `production`

## Redis Setup (Optional but Recommended)

The application works without Redis, but having Redis improves performance by caching frequently accessed data.

### Without Redis
- The app will show warnings in logs: "ECONNREFUSED 127.0.0.1:6379"
- These can be safely ignored
- All features work normally, just slightly slower

### With Redis (Recommended)
1. **Redis Cloud (Free tier available)**
   - Sign up at [https://redis.com](https://redis.com)
   - Create a free database
   - Copy the connection string
   - Add as `REDIS_URL` in Render

2. **Upstash (Serverless Redis)**
   - Sign up at [https://upstash.com](https://upstash.com)
   - Create a Redis database
   - Use the Redis connection string
   - Add as `REDIS_URL` in Render

## Step 4: Deploy

1. Connect GitHub repository to Render
2. Render will auto-deploy on push to main branch
3. Initial deploy takes 10-15 minutes
4. Check logs for any errors

## Step 5: Post-Deploy

1. Run database migrations:
```bash
# SSH into your Render service or run locally with production DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
```

2. Access your app:
- Backend: `https://your-backend-name.onrender.com`
- Frontend: `https://your-frontend-name.onrender.com`

3. Default login:
- Username: `admin`
- Password: `admin123`

## Monitoring

### Check Deployment Status
Run the included script:
```bash
chmod +x check-deployment.sh
./check-deployment.sh
```

### View Logs
- In Render Dashboard → Service → Logs
- Common log messages:
  - ✅ "Redis connected successfully" - Redis is working
  - ⚠️ "Redis URL not configured" - Running without cache (OK)
  - ❌ "ECONNREFUSED 127.0.0.1:6379" - Redis connection failed (can ignore if no Redis)

## Troubleshooting

### Redis Connection Errors
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: This is normal if Redis is not configured. The app works fine without it.

### Database Connection Failed
```
Error: Can't reach database server
```
**Solution**: 
- Verify DATABASE_URL includes `?sslmode=require`
- Check Neon.tech dashboard for connection limits
- Ensure database is active (may sleep on free tier)

### CORS Errors
```
Access to fetch at 'backend-url' from origin 'frontend-url' has been blocked by CORS
```
**Solution**:
- Update `FRONTEND_URL` in backend environment
- Update `VITE_API_URL` in frontend environment
- Redeploy both services

### Build Failures
- Check Node version (requires 18+)
- Verify all dependencies in package.json
- Check build logs in Render dashboard

## Performance Tips

1. **Enable Redis** for better performance (optional)
2. **Use CDN** for static assets
3. **Enable auto-scaling** (paid feature)
4. **Monitor usage** in Render dashboard

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS (automatic on Render)
- [ ] Configure CORS properly
- [ ] Review environment variables
- [ ] Enable rate limiting

## Costs

### Free Tier Limits
- **Render**: 750 hours/month, auto-sleep after 15 min
- **Neon.tech**: 3GB storage, auto-pause
- **Redis Cloud**: 30MB RAM (optional)

### Recommended Paid Setup
- Render Starter: $7/month per service (no sleep)
- Neon Pro: $19/month (better performance)
- Redis Cloud: $5/month (more memory)

## Support

- Render Docs: [https://render.com/docs](https://render.com/docs)
- Neon Docs: [https://neon.tech/docs](https://neon.tech/docs)
- Project Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/restaurant-inventory-system/issues)