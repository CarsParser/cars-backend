import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PlatformRepository } from 'src/platforms/platform.repository';

@Injectable()
export class CarProducerService {
  private readonly logger = new Logger(CarProducerService.name);

  constructor(
    @Inject('CAR_SERVICE') private client: ClientKafka,
    private configService: ConfigService,
    private platformRepository: PlatformRepository,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    const platforms = await this.platformRepository.find();

    this.logger.debug('Load cars', platforms);

    for (const platform of platforms) {
      for (const cityConfig of platform.config) {
        this.client.emit('load_cars', {
          platform: platform.name,
          city: cityConfig.city,
          lastProcessedRecordTimestamp: cityConfig.lastProcessedRecordTimestamp,
        });
      }
    }
  }
}
