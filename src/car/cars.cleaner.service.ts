import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CarRepository } from './car.repository';
import { subHours } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import { ElkLogger } from 'src/helpers';

@Injectable()
export class CarsCleanerService {
  constructor(
    private readonly carRepository: CarRepository,
    private configService: ConfigService,
    private elkLogger: ElkLogger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanCars() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    try {
      await this.carRepository.cleanCars(subHours(new Date(), 1));
    } catch (err) {
      this.elkLogger.error(CarsCleanerService.name, err);
    }
  }
}
