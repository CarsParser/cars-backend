import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { City, Platform } from 'src/common';
import { BlockerFunction, blocker } from 'src/helpers';
import Redis from 'ioredis';

@Injectable()
export class CarProducerService {
  private blocker?: BlockerFunction;
  private readonly logger = new Logger(CarProducerService.name);

  constructor(
    @Inject('CAR_SERVICE') private client: ClientKafka,
    private configService: ConfigService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {
    if (!this.blocker) {
      this.blocker = blocker({ redis: this.redis, prefix: 'app' });
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    const platforms = Object.keys(Platform);
    const cities = Object.keys(City);
    this.logger.debug('Load cars', platforms);

    for (const platform of platforms) {
      for (const city of cities) {
        try {
          const unblock = await this.blocker(
            `load_cars_${platform}_${city}`,
            60 * 5,
          );
          this.send({ platform, city }, unblock);
        } catch (err) {}
      }
    }
  }

  send(
    { platform, city }: { platform: string; city: string },
    unblock: () => Promise<void>,
  ) {
    this.client
      .send('load_cars', {
        platform: platform,
        city: city,
      })
      .subscribe(async ({ platform, city }) => {
        this.logger.debug(`Finished car loading for ${platform} city ${city}`);
        await unblock();
      });
  }

  onModuleInit() {
    this.client.subscribeToResponseOf('load_cars');
  }
}
