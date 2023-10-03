import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
  Transport,
} from '@nestjs/microservices';
import { City, Platform } from 'src/common';
import { ProviderFactory } from 'src/platforms/providers/provider.factory';

export interface Data {
  platform: Platform;
  city: City;
}

@Controller('car-consumer')
export class CarConsumerController {
  private readonly logger = new Logger(CarConsumerController.name);

  constructor(private providerFactory: ProviderFactory) {}

  @MessagePattern('load_cars', Transport.KAFKA)
  async handleCarsNotifications(
    @Payload() data: Data,
    @Ctx() context: KafkaContext,
  ) {
    let interval: NodeJS.Timeout;

    try {
      const heartbeat = context.getHeartbeat();
      interval = setInterval(heartbeat, 1500);

      this.logger.debug('Loading cars', { data });

      const providerRepository = this.providerFactory.create(data.platform);
      await providerRepository.loadCars(data.city);

      return { platform: data.platform, city: data.city };
    } catch (err) {
      this.logger.error(
        `Load cars fauled for platform ${data.platform} city ${data.city}`,
      );
      throw err;
    } finally {
      if (interval) {
        clearInterval(interval);
      }
    }
  }
}
