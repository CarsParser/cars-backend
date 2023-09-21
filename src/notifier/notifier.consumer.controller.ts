import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';
import { CarRepository } from 'src/car/car.repository';
import { User } from 'src/user/user.entity';

@Controller('notifications')
export class NotifierConsumerController {
  private readonly logger = new Logger(NotifierConsumerController.name);

  constructor(private carsRepository: CarRepository) {}

  @EventPattern('cars_notification', Transport.KAFKA)
  async handleCarsNotifications(user: User) {
    this.logger.debug('Notify user', user);

    const carsToOffer = await this.carsRepository.find(user.config);

    this.logger.debug(`Found cars for user ${user.id}`, carsToOffer);

    // TODO: send to bot
  }
}
