import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';
import { SearchCarsData } from 'src/common';
import { ProviderFactory } from 'src/platforms/providers/provider.factory';
import { CarRepository } from './car.repository';
import { PlatformRepository } from 'src/platforms/platform.repository';
import { BlockerService } from 'src/helpers/blocker.service';

@Controller('car-consumer')
export class CarConsumerController {
  private readonly logger = new Logger(CarConsumerController.name);

  constructor(
    private providerFactory: ProviderFactory,
    private carRespository: CarRepository,
    private platformRepository: PlatformRepository,
    private blockerService: BlockerService,
  ) {}

  @EventPattern('load_cars', Transport.KAFKA)
  async handleCarsNotifications(data: SearchCarsData) {
    const blockKey = `load_cars_${data.platform}_${data.city}`;

    try {
      const isBlocked = await this.blockerService.block(blockKey, 2 * 60);
      if (isBlocked) {
        this.logger.log(
          `Load cars blocked platform ${data.platform} city ${data.city}`,
        );
        return;
      }

      this.logger.debug('Loading cars', data);

      const providerRepository = this.providerFactory.create(data.platform);
      const { cars, lastProcessedRecordTimestamp } =
        await providerRepository.find(data);

      this.logger.debug('Loaded cars', cars);
      this.logger.debug(
        'LastProcessedRecordTimestamp',
        lastProcessedRecordTimestamp,
      );

      if (cars.length > 0) {
        await this.carRespository.save(cars);

        const platform = await this.platformRepository.findOne(data.platform);

        for (const cityConfig of platform.config) {
          if (cityConfig.city === data.city) {
            cityConfig.lastProcessedRecordTimestamp = new Date(
              lastProcessedRecordTimestamp,
            );
          }
        }

        await this.platformRepository.update(platform);
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
