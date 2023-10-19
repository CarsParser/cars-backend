import { Body, Controller, Post } from '@nestjs/common';
import { CarRepository } from './car.repository';
import { Car } from './car.entity';

@Controller('car')
export class CarController {
  constructor(private carRepository: CarRepository) {}

  @Post('create')
  async create(@Body() car: Car) {
    await this.carRepository.save([car]);
  }
}
