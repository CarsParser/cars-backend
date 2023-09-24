import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';
import { City, Platform } from 'src/common';
import { ProviderFactory } from 'src/platforms/providers/provider.factory';
import { CarRepository } from './car.repository';
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
    private carRespository: CarRepository,
    private blockerService: BlockerService,
  ) {}

  @EventPattern('load_cars', Transport.KAFKA)
  async handleCarsNotifications(data: Data) {
    const blockKey = `load_cars_${data.platform}_${data.city}`;

    try {
      const isBlocked = await this.blockerService.block(blockKey, 10 * 60);
      if (isBlocked) {
        this.logger.log(
          `Load cars blocked platform ${data.platform} city ${data.city}`,
        );
        return;
      }

      this.logger.debug('Loading cars', data);

      const lastProcessedCars = await this.carRespository.findLastProcessedCars(
        data.city,
        data.platform,
      );
      this.logger.debug(`Platform ${data.platform} city ${data.city}`, {
        lastProcessedCars,
      });

      const providerRepository = this.providerFactory.create(data.platform);
      const { cars } = await providerRepository.find({
        ...data,
        lastProcessedCars,
      });

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
      await this.blockerService.unblock(blockKey);
    }
  }
}
