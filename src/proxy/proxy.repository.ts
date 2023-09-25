import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface Proxy {
  host: string;
  port: number;
  auth?: {
    user: string;
    password: string;
  };
  bannedAt?: Date;
}

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

@Injectable()
export class ProxyRepository {
  private readonly proxyListKey: string = 'proxy';
  private readonly logger = new Logger(ProxyRepository.name);

  constructor(@Inject('REDIS') private redis: Redis) {}

  async add(proxy: Proxy) {
    this.logger.debug('Adding proxy', proxy);

    await this.redis.rpush(this.proxyListKey, JSON.stringify(proxy));
  }

  async get(): Promise<Proxy | undefined> {
    let proxy: string | undefined;

    for (let i = 0; i <= 5; i++) {
      proxy = await this.redis.lpop(this.proxyListKey);

      if (proxy) {
        break;
      }

      await sleep(1000);
    }

    return proxy ? JSON.parse(proxy) : undefined;
  }

  async find(): Promise<Proxy[]> {
    const proxyList = await this.redis.lrange(this.proxyListKey, 0, -1);

    this.logger.debug(
      'Find proxy',
      proxyList.map((proxy) => JSON.parse(proxy)),
    );

    return proxyList.map((proxy) => JSON.parse(proxy));
  }

  async delete(proxy: Proxy) {
    this.logger.debug('Delete proxy', proxy);

    await this.redis.lrem(this.proxyListKey, 0, JSON.stringify(proxy));
  }
}
