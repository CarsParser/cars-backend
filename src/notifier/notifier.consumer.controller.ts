import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';
import { CarRepository } from 'src/car/car.repository';
import { BlockerService } from 'src/helpers/blocker.service';
import { User } from 'src/user/user.entity';

@Controller('notification-consumer')
export class NotifierConsumerController {
  private readonly logger = new Logger(NotifierConsumerController.name);

  constructor(
    private carsRepository: CarRepository,
    private blockerService: BlockerService,
  ) {}

  @EventPattern('cars_notification', Transport.KAFKA)
  async handleCarsNotifications(user: User) {
    const blockKey = `notify_${user.id}`;
    const isBlocked = await this.blockerService.block(blockKey, 2 * 60 * 1000);
    if (isBlocked) {
      this.logger.log(`Cars notifications blocked userId ${user.id}`);
      return;
    }

    this.logger.debug('Notify user', user);

    const carsToOffer = await this.carsRepository.find(user.config);

    this.logger.debug(`Found cars for user ${user.id}`, carsToOffer);

    // TODO: send to bot

    await this.blockerService.unblock(blockKey);
  }
}
