import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Transport } from '@nestjs/microservices';
import { CarRepository } from 'src/car/car.repository';
import { BlockerService } from 'src/helpers/blocker.service';
import { User } from 'src/user/user.entity';
import { UserRepository } from '../user/user.repository';
import { subSeconds } from 'date-fns';

@Controller('notification-consumer')
export class NotifierConsumerController {
  private readonly logger = new Logger(NotifierConsumerController.name);

  constructor(
    private carsRepository: CarRepository,
    private blockerService: BlockerService,
    private userRepository: UserRepository,
  ) {}

  @EventPattern('cars_notification', Transport.KAFKA)
  async handleCarsNotifications(user: User) {
    const blockKey = `notify_${user.id}`;

    try {
      const isBlocked = await this.blockerService.block(blockKey, 2 * 60);
      if (isBlocked) {
        this.logger.log(`Cars notifications blocked userId ${user.id}`);
        return;
      }

      this.logger.debug('Notify user', user);

      const carsToOffer = await this.carsRepository.find(user);

      this.logger.debug(
        `Found cars for user ${user.id}, last watched car is ${user.lastWatchedCar}`,
        carsToOffer,
      );

      if (carsToOffer.length) {
        await this.userRepository.sendTg(user.id, carsToOffer);

        user.lastWatchedCar = subSeconds(
          carsToOffer.sort((a, b) => {
            if (!b.postedAt) {
              return -1;
            }
            if (!a.postedAt) {
              return 1;
            }
            return b.postedAt.getTime() - a.postedAt.getTime();
          })[0].postedAt,
          -1,
        );
        await this.userRepository.update(user);
        this.logger.debug(
          `Last watched car was updated: ${user.lastWatchedCar}`,
        );
      }

      // TODO: send to bot
    } catch (err) {
      this.logger.error(`Unable to notify user ${user.id} about new cars`, err);
      throw err;
    } finally {
      await this.blockerService.unblock(blockKey);
    }
  }
}
