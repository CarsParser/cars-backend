import { Controller } from '@nestjs/common';
import { ElkLogger } from 'src/helpers';
import {
  Ctx,
  KafkaContext,
  MessagePattern,
  Payload,
  Transport,
} from '@nestjs/microservices';
import { City, Platform } from 'src/common';
import { ProviderFactory } from 'src/platforms/providers/provider.factory';
import { LogLevel } from 'src/helpers/logger';

export interface Data {
  platform: Platform;
  city: City;
}

@Controller('car-consumer')
export class CarConsumerController {
  constructor(
    private providerFactory: ProviderFactory,
    private elkLogger: ElkLogger,
  ) {}

  @MessagePattern('load_cars', Transport.KAFKA)
  async handleCarsNotifications(
    @Payload() data: Data,
    @Ctx() context: KafkaContext,
  ) {
    let interval: NodeJS.Timeout;

    try {
      const heartbeat = context.getHeartbeat();
      interval = setInterval(heartbeat, 1500);

      this.elkLogger.log(CarConsumerController.name, 'lodaing cars', data);

      const providerRepository = this.providerFactory.create(data.platform);
      await providerRepository.loadCars(data.city);

      return { platform: data.platform, city: data.city };
    } catch (err) {
      this.elkLogger.error(
        CarConsumerController.name,
        'loading cars error',
        err,
        LogLevel.HIGH,
      );
      return { platform: data.platform, city: data.city };
    } finally {
      if (interval) {
        clearInterval(interval);
      }
    }
  }
}
