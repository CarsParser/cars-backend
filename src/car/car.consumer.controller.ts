import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
  Transport,
} from '@nestjs/microservices';
import { City, Platform } from 'src/common';
import { ProviderFactory } from 'src/platforms/providers/provider.factory';
import { BlockerService } from 'src/helpers/blocker.service';

export interface Data {
  platform: Platform;
  city: City;
}

@Controller('car-consumer')
export class CarConsumerController {
  private readonly logger = new Logger(CarConsumerController.name);

  constructor(
    private providerFactory: ProviderFactory,
    private blockerService: BlockerService,
  ) {}

  @EventPattern('load_cars', Transport.KAFKA)
  async handleCarsNotifications(
    @Payload() data: Data,
    @Ctx() context: KafkaContext,
  ) {
    const blockKey = `load_cars_${data.platform}_${data.city}`;
    let interval: NodeJS.Timeout;

    try {
      const isBlocked = await this.blockerService.block(blockKey, 10 * 60);
      if (isBlocked) {
        this.logger.log(
          `Load cars blocked platform ${data.platform} city ${data.city}`,
        );
        return;
      }

      const heartbeat = context.getHeartbeat();
      interval = setInterval(heartbeat, 1500);

      this.logger.debug('Loading cars', { data });

      const providerRepository = this.providerFactory.create(data.platform);
      await providerRepository.loadCars(data.city);
    } catch (err) {
      this.logger.error(
        `Load cars fauled for platform ${data.platform} city ${data.city}`,
      );
      throw err;
    } finally {
      await this.blockerService.unblock(blockKey);

      if (interval) {
        clearInterval(interval);
      }
    }
  }
}
