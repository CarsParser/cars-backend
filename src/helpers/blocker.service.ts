import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class BlockerService {
  private readonly logger = new Logger(BlockerService.name);

  constructor(@Inject('REDIS') private redis: Redis) {}

  public async block(key: string, ttl: number): Promise<boolean> {
    this.logger.debug(`Block ${key}`);

    const isBlocked = await this.redis.get(key);

    if (isBlocked) {
      this.logger.debug(`Is blocked ${key}`);
      return true;
    }

    this.logger.debug(`Not blocker ${key}`);

    await this.redis.set(key, 1, 'EX', ttl);

    return false;
  }

  public async isBlocked(key: string): Promise<boolean> {
    const blocked = await this.redis.get(key);

    return Boolean(blocked);
  }

  public async unblock(key: string) {
    this.logger.debug(`Unblock ${key}`);
    await this.redis.del(key);
  }
}
