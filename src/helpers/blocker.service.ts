import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class BlockerService {
  private readonly logger = new Logger(BlockerService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public async block(key: string, ttl: number): Promise<boolean> {
    this.logger.debug(`Block ${key}`);

    const isBlocked = await this.cacheManager.get<boolean>(key);

    if (isBlocked) {
      this.logger.debug(`Is blocked ${key}`);
      return true;
    }

    this.logger.debug(`Not blocker ${key}`);

    await this.cacheManager.set(key, true, ttl);

    return false;
  }

  public async unblock(key: string) {
    this.logger.debug(`Unblock ${key}`);
    await this.cacheManager.del(key);
  }
}
