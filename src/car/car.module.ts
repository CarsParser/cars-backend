import { Module } from '@nestjs/common';
import { CarRepository } from './car.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, CarSchema } from './car.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Car.name, schema: CarSchema }])],
  providers: [CarRepository],
  exports: [CarRepository],
})
export class CarModule {}
