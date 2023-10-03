import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { CarRepository } from 'src/car/car.repository';
import { User } from 'src/user/user.entity';
import { UserRepository } from '../user/user.repository';
import { Car } from 'src/car/car.entity';
import { isEqual } from 'date-fns';

@Controller('notification-consumer')
export class NotifierConsumerController {
  private readonly logger = new Logger(NotifierConsumerController.name);

  constructor(
    private carsRepository: CarRepository,
    private userRepository: UserRepository,
  ) {}

  @MessagePattern('cars_notification', Transport.KAFKA)
  async handleCarsNotifications(@Payload() user: User) {
    try {
      this.logger.debug('Notify user', user);

      const carsToOffer = await this.carsRepository.find(user);
      let carsToOfferFiltered: Car[] = JSON.parse(JSON.stringify(carsToOffer));

      this.logger.debug(
        `Found cars for user ${user.id}, last watched car is ${user.lastWatchedCars?.lastWatchedCarDateTime}`,
        carsToOffer,
      );

      if (carsToOffer.length) {
        if (user.lastWatchedCars?.lastWatchedCarIds?.length) {
          carsToOfferFiltered = carsToOffer.filter(
            (car) => !user.lastWatchedCars.lastWatchedCarIds.includes(car.url),
          );
        }
        this.logger.debug(
          `Found cars for user ${user.id} filtered`,
          carsToOfferFiltered,
        );

        await this.userRepository.sendTg(user.id, carsToOfferFiltered);

        const lastWatchedCarDateTime = carsToOffer.sort((a, b) => {
          if (!b.postedAt) {
            return -1;
          }
          if (!a.postedAt) {
            return 1;
          }
          return b.postedAt.getTime() - a.postedAt.getTime();
        })[0].postedAt;
        const lastWatchedCarIds = carsToOffer
          .filter((car) => isEqual(car.postedAt, lastWatchedCarDateTime))
          .map((car) => car.url);
        user.lastWatchedCars = {
          lastWatchedCarDateTime,
          lastWatchedCarIds,
        };
        this.logger.debug(`User ${user.id} last watched cars`, {
          lastWatchedCars: user.lastWatchedCars,
        });
        await this.userRepository.update(user);
      }

      return {
        userId: user.id,
        sentCarIds: carsToOfferFiltered.map((car) => car.url),
      };
    } catch (err) {
      this.logger.error(`Unable to notify user ${user.id} about new cars`, err);
      throw err;
    }
  }
}
