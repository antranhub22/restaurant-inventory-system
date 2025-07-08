import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

// Rate limit cho OCR processing
export const ocrRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // 10 requests mỗi phút
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    prefix: 'rl:ocr:',
    // @ts-ignore - Type mismatch but works in runtime
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
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
  store: new RedisStore({
    prefix: 'rl:api:',
    // @ts-ignore - Type mismatch but works in runtime
    sendCommand: (...args: string[]) => redis.call(...args)
  }),
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  }
}); 