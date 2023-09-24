import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { City, Platform } from 'src/common';
import { BlockerService } from 'src/helpers/blocker.service';

@Injectable()
export class CarProducerService {
  private readonly logger = new Logger(CarProducerService.name);

  constructor(
    @Inject('CAR_SERVICE') private client: ClientKafka,
    private configService: ConfigService,
    private blockerService: BlockerService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    const platforms = Object.keys(Platform);
    const cities = Object.keys(City);
    this.logger.debug('Load cars', platforms);

    for (const platform of platforms) {
      for (const city of cities) {
        const blocked = await this.blockerService.isBlocked(
          `load_cars_${platform}_${city}`,
        );

        if (blocked) {
          this.logger.debug(
            `City ${city} platform ${platform} blocked ${blocked}`,
          );
          continue;
        }

        this.client.emit('load_cars', {
          platform: platform,
          city: city,
        });
      }
    }
  }
}
