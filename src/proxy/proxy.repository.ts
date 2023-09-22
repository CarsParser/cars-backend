import { Inject, Injectable } from '@nestjs/common';
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
  constructor(@Inject('REDIS') private redis: Redis) {}

  async add(proxy: Proxy) {
    await this.redis.rpush('proxy', JSON.stringify(proxy));
  }

  async get(): Promise<Proxy> {
    let proxy: string;

    while (!proxy) {
      proxy = await this.redis.lpop('proxy');
      sleep(1000);
    }

    return JSON.parse(proxy);
  }

  async find(): Promise<Proxy[]> {
    const proxyList = await this.redis.lrange('proxy', 0, -1);

    return proxyList.map((proxy) => JSON.parse(proxy));
  }
}
