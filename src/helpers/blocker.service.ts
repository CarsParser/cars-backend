import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class BlockerService {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    public async block(
        key: string,
        ttl: number
    ): Promise<boolean> {
        const isBlocked = await this.cacheManager.get<boolean>(key);

        if (isBlocked) {
            return true;
        }

        await this.cacheManager.set(key, true, ttl);

        return false;
    }

    public async unblock(key: string) {
        await this.cacheManager.del(key);
    }
}