import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

let store: any = undefined;

// Thử kết nối Redis với xử lý lỗi
try {
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl && redisUrl !== '') {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null // Không retry
    });

    redis.on('error', (err: Error) => {
      console.warn('⚠️  Rate limit Redis error:', err.message);
    });

    // Kiểm tra kết nối
    redis.ping().then(() => {
      console.log('✅ Rate limit Redis connected');
    }).catch(() => {
      console.warn('⚠️  Rate limit Redis not available, using memory store');
      redis.disconnect();
    });

    store = new RedisStore({
      prefix: 'rl:',
      // @ts-ignore - Type mismatch but works in runtime
      sendCommand: (...args: string[]) => redis.call(...args).catch(() => {
        // Silently fail if Redis is down
        return null;
      })
    });
  }
} catch (error) {
  console.warn('⚠️  Rate limit Redis initialization failed, using memory store');
}

// Rate limit cho OCR processing
export const ocrRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // 10 requests mỗi phút
  standardHeaders: true,
  legacyHeaders: false,
  store: store, // Sử dụng store đã được khởi tạo hoặc undefined (memory)
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  }
});

// Rate limit cho API chung
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // 100 requests mỗi 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  store: store, // Sử dụng store đã được khởi tạo hoặc undefined (memory)
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  }
}); 