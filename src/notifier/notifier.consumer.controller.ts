import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { CarRepository } from 'src/car/car.repository';
import { User } from 'src/user/user.entity';
import { UserRepository } from '../user/user.repository';
import { Car } from 'src/car/car.entity';
import { isEqual } from 'date-fns';
import { ElkLogger } from 'src/helpers';
import { LogLevel } from 'src/helpers/logger';

@Controller('notification-consumer')
export class NotifierConsumerController {
  constructor(
    private carsRepository: CarRepository,
    private userRepository: UserRepository,
    private elkLogger: ElkLogger,
  ) {}

  @MessagePattern('cars_notification', Transport.KAFKA)
  async handleCarsNotifications(@Payload() userId: { id: string }) {
    try {
      const user = await this.userRepository.findOne({ id: userId.id });
      if (!user.monitor) {
        return {
          userId: user.id,
          sentCarIds: [],
        };
      }
      this.elkLogger.log(
        NotifierConsumerController.name,
        'notify user',
        user,
        LogLevel.MEDIUM,
      );

      const carsToOffer = await this.carsRepository.find(user);
      let carsToOfferFiltered: Car[] = JSON.parse(JSON.stringify(carsToOffer));

      this.elkLogger.log(NotifierConsumerController.name, 'cars to offer', {
        carsToOffer,
        user,
      });

      if (carsToOffer.length) {
        if (user.lastWatchedCars?.lastWatchedCarIds?.length) {
          carsToOfferFiltered = carsToOffer.filter(
            (car) => !user.lastWatchedCars.lastWatchedCarIds.includes(car.url),
          );
        }
        this.elkLogger.log(
          NotifierConsumerController.name,
          'filtered cars to offer',
          {
            carsToOfferFiltered,
            user,
          },
        );

        if (carsToOfferFiltered.length) {
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
          this.elkLogger.log(
            NotifierConsumerController.name,
            'user last watched cars',
            {
              lastWatchedCars: user.lastWatchedCars,
            },
          );
          await this.userRepository.update(user);
        }
      }

      return {
        userId: user.id,
        sentCarIds: carsToOfferFiltered.map((car) => car.url),
      };
    } catch (err) {
      this.elkLogger.error(
        NotifierConsumerController.name,
        'unable to nofity user',
        err,
        LogLevel.HIGH,
      );
      throw err;
    }
  }
}
