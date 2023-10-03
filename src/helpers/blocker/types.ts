import Redis from 'ioredis';

export type RedisLib = Redis;

export type BlockerOptions = {
  /**
   * Redis instance with required methods
   */
  redis: Redis;

  /**
   * Prefix for block key
   */
  prefix: string;
};

export type BlockOptions = {
  /**
   * Time in seconds
   * @default 60
   */
  time?: number;

  /**
   * Extend interval in seconds
   */
  extendInterval?: number;

  /**
   * Extend time in seconds
   * By default has same value, as time if defined
   */
  extendTime?: number;
};
