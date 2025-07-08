import { Redis } from 'ioredis';

declare module 'ioredis' {
  interface Redis {
    subscribe(
      channel: string,
      callback: (err: Error | null) => void
    ): Promise<number>;
    publish(
      channel: string,
      message: string
    ): Promise<number>;
  }
} 