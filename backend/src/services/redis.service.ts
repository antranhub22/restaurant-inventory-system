import { Redis } from 'ioredis';

class RedisService {
  private redis: Redis | null = null;
  private isRedisAvailable: boolean = false;
  private static instance: RedisService;

  private constructor() {
    this.initializeRedis();
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private initializeRedis() {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl || redisUrl === '') {
      console.warn('⚠️  Redis URL not configured. Running without Redis cache.');
      this.isRedisAvailable = false;
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.error('❌ Redis connection failed after 3 retries');
            this.isRedisAvailable = false;
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'];
          if (targetErrors.some(e => err.message.includes(e))) {
            return true;
          }
          return false;
        }
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (err: Error) => {
        console.error('❌ Redis error:', err.message);
        this.isRedisAvailable = false;
      });

      this.redis.on('close', () => {
        console.warn('⚠️  Redis connection closed');
        this.isRedisAvailable = false;
      });

    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      this.isRedisAvailable = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isRedisAvailable || !this.redis) {
      return null;
    }

    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, expiry?: number): Promise<boolean> {
    if (!this.isRedisAvailable || !this.redis) {
      return false;
    }

    try {
      if (expiry) {
        await this.redis.set(key, value, 'EX', expiry);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isRedisAvailable || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async publish(channel: string, message: string): Promise<boolean> {
    if (!this.isRedisAvailable || !this.redis) {
      return false;
    }

    try {
      await this.redis.publish(channel, message);
      return true;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  }

  createSubscriber(): Redis | null {
    if (!process.env.REDIS_URL || process.env.REDIS_URL === '') {
      return null;
    }

    try {
      return new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3
      });
    } catch (error) {
      console.error('Failed to create Redis subscriber:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return this.isRedisAvailable;
  }

  getClient(): Redis | null {
    return this.redis;
  }
}

export default RedisService;