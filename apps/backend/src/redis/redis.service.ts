import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB') || 0,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  // Refresh token specific methods
  async setRefreshToken(
    tokenHash: string,
    userId: string,
    ttl: number,
  ): Promise<void> {
    const key = `refresh_token:${tokenHash}`;
    await this.set(key, userId, ttl);
  }

  async validateRefreshToken(tokenHash: string): Promise<string | null> {
    const key = `refresh_token:${tokenHash}`;
    return this.get(key);
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const key = `refresh_token:${tokenHash}`;
    await this.del(key);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:*`;
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const storedUserId = await this.redis.get(key);
      if (storedUserId === userId) {
        await this.redis.del(key);
      }
    }
  }
}
