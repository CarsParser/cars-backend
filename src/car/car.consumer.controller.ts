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
import { CarRepository } from './car.repository';
import { BlockerService } from 'src/helpers/blocker.service';
import { Proxy, ProxyRepository } from 'src/proxy/proxy.repository';

export interface Data {
  platform: Platform;
  city: City;
}

@Controller('car-consumer')
export class CarConsumerController {
  private readonly logger = new Logger(CarConsumerController.name);

  constructor(
    private providerFactory: ProviderFactory,
    private carRespository: CarRepository,
    private blockerService: BlockerService,
    private proxyRepository: ProxyRepository,
  ) {}

  @EventPattern('load_cars', Transport.KAFKA)
  async handleCarsNotifications(
    @Payload() data: Data,
    @Ctx() context: KafkaContext,
  ) {
    const blockKey = `load_cars_${data.platform}_${data.city}`;
    let proxy: Proxy | undefined;

    try {
      const isBlocked = await this.blockerService.block(blockKey, 10 * 60);
      if (isBlocked) {
        this.logger.log(
          `Load cars blocked platform ${data.platform} city ${data.city}`,
          { proxy },
        );
        return;
      }

      this.logger.debug('Loading cars', { data });
      const lastProcessedCars = await this.carRespository.findLastProcessedCars(
        data.city,
        data.platform,
      );
      proxy = await this.proxyRepository.get();
      this.logger.debug(`Platform ${data.platform} city ${data.city}`, {
        lastProcessedCars,
        proxy,
      });

      const heartbeat = context.getHeartbeat();
      const providerRepository = this.providerFactory.create(data.platform);
      const { cars } = await providerRepository.find({
        ...data,
        lastProcessedCars,
        heartbeat,
        proxy,
      });

      await heartbeat();
      this.logger.debug('Loaded cars', cars);

      if (cars.length > 0) {
        await this.carRespository.save(cars);
      }
    } catch (err) {
      this.logger.error(
        `Load cars fauled for platform ${data.platform} city ${data.city}`,
      );
      throw err;
    } finally {
      if (proxy) {
        await this.proxyRepository.add(proxy);
      }
      await this.blockerService.unblock(blockKey);
    }
  }
}
