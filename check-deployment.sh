#!/bin/bash

echo "🔍 Checking Restaurant Inventory System deployment..."
echo "================================================"

# Check backend health
echo -e "\n📡 Checking backend health..."
BACKEND_URL="${BACKEND_URL:-https://restaurant-inventory-backend.onrender.com}"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")

if [ $? -eq 0 ]; then
    echo "✅ Backend is reachable"
    echo "Response: $HEALTH_RESPONSE"
    
    # Parse Redis status
    REDIS_STATUS=$(echo $HEALTH_RESPONSE | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
    if [ "$REDIS_STATUS" = "not configured" ]; then
        echo "⚠️  Redis is not configured - running without cache"
        echo "   To enable Redis:"
        echo "   1. Sign up at https://redis.com or https://upstash.com"
        echo "   2. Create a Redis instance"
        echo "   3. Add REDIS_URL to Render environment variables"
    elif [ "$REDIS_STATUS" = "connected" ]; then
        echo "✅ Redis is connected"
    fi
else
    echo "❌ Backend is not reachable"
fi

# Check frontend
echo -e "\n🌐 Checking frontend..."
FRONTEND_URL="${FRONTEND_URL:-https://restaurant-inventory-frontend.onrender.com}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
    echo "❌ Frontend returned HTTP $FRONTEND_STATUS"
fi

# Summary
echo -e "\n📊 Summary:"
echo "================================================"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo "💡 Tips:"
echo "- The system will work without Redis, but performance may be slower"
echo "- Check Render logs for detailed error messages"
echo "- Ensure DATABASE_URL is properly configured in Render"

# Check for common issues
echo -e "\n🔧 Common issues and solutions:"
echo "================================================"
echo "1. ECONNREFUSED Redis errors:"
echo "   - This is expected if Redis is not configured"
echo "   - The app will continue to work using database only"
echo ""
echo "2. Database connection errors:"
echo "   - Verify DATABASE_URL in Render environment"
echo "   - Ensure it includes ?sslmode=require"
echo ""
echo "3. CORS errors:"
echo "   - Update FRONTEND_URL in backend environment"
echo "   - Update VITE_API_URL in frontend environment"