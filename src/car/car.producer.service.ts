import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { City, Platform } from 'src/common';
import { BlockerFunction, ElkLogger, blocker } from 'src/helpers';
import Redis from 'ioredis';
import { LogLevel } from 'src/helpers/logger';

@Injectable()
export class CarProducerService {
  private blocker?: BlockerFunction;

  constructor(
    @Inject('CAR_SERVICE') private client: ClientKafka,
    private configService: ConfigService,
    @Inject('REDIS') private readonly redis: Redis,
    private elkLogger: ElkLogger,
  ) {
    if (!this.blocker) {
      this.blocker = blocker({ redis: this.redis, prefix: 'app' });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    const platforms = Object.keys(Platform);
    const cities = Object.keys(City);
    this.elkLogger.log(
      CarProducerService.name,
      'sending task to load cars',
      { platforms, cities },
      LogLevel.LOW,
    );

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
        this.elkLogger.log(CarProducerService.name, 'loaded cars', {
          platform,
          city,
        });
        await unblock();
      });
  }

  onModuleInit() {
    this.client.subscribeToResponseOf('load_cars');
  }
}
