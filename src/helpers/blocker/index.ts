import { BlockedError } from './errors';
import { BlockOptions, BlockerOptions, RedisLib } from './types';

export class Blocker {
  protected redis: RedisLib;
  protected prefix: string;
  protected intervals: Map<string, NodeJS.Timeout>;

  public constructor({ redis, prefix }: BlockerOptions) {
    this.redis = redis;
    this.prefix = prefix;
    this.intervals = new Map();
  }

  /**
   * Trying to acquire block for specified key for specified time.
   * To get an extensible lock, please use extendInterval and extendTime options
   */
  public async block(
    key: string,
    options: BlockOptions = {},
  ): Promise<(() => Promise<void>) | undefined> {
    const { time = 60, extendInterval, extendTime = time } = options;

    const redisKey = this.getBlockKey(key);
    const result = await this.redis.set(redisKey, 'blocked', 'EX', time, 'NX');

    if (result !== 'OK') {
      return undefined;
    }

    // Disable lock extension process,
    // when extended lock already exists for specified key
    clearInterval(this.intervals.get(key));

    // Start lock extension process
    if (extendInterval) {
      const interval = setInterval(() => {
        this.redis.expire(redisKey, extendTime).then(
          // Disable lock extension process, when no redisKey found
          (extended) => {
            if (extended !== 1) {
              clearInterval(interval);
            }
          },
          // Suppress errors
          () => undefined,
        );
      }, extendInterval * 1000);

      this.intervals.set(key, interval);
    }

    return async () => {
      await this.unblock(key);
    };
  }

  /**
   * Release lock for specified key
   */
  public async unblock(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
    const redisKey = this.getBlockKey(key);
    await this.redis.del(redisKey);
  }

  /**
   * Clear all lock extension processes if used
   */
  public destroy() {
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
  }

  protected getBlockKey(key: string) {
    return `${this.prefix}_${key}`;
  }
}

export type BlockerFunction = (
  key: string,
  time: number,
) => Promise<() => Promise<void>>;

/**
 * Blocker function
 *
 * @returns block function
 */
export function blocker({ redis, prefix }: BlockerOptions): BlockerFunction {
  const blockerInstance = new Blocker({ redis, prefix });

  /**
   * Block function
   *
   * @throws {BlockedError} if key is already blocked
   * @returns unblock function
   */
  return async (key: string, time = 60) => {
    const block = await blockerInstance.block(key, { time });
    if (!block) {
      throw new BlockedError(`Запись ${key} заблокирована`);
    }
    return block;
  };
}
