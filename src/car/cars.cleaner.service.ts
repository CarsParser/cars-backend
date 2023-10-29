import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CarRepository } from './car.repository';
import { subHours } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import { ElkLogger } from 'src/helpers';
import { TgService } from '../client/tg/tg.service';

@Injectable()
export class CarsCleanerService {
  constructor(
    private readonly carRepository: CarRepository,
    private configService: ConfigService,
    private elkLogger: ElkLogger,
    private tgService: TgService,
  ) {}

  @Cron(CronExpression.EVERY_2_HOURS)
  async cleanCars() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }
    try {
      await this.carRepository.cleanCars(subHours(new Date(), 2));
    } catch (err) {
      this.elkLogger.error(CarsCleanerService.name, err);
    }
    try {
      const cheapCars = await this.carRepository.findCheap();
      await this.tgService.sendCheapCars(cheapCars);
    } catch (e) {
      this.elkLogger.error(CarsCleanerService.name, e);
    }
  }
}
