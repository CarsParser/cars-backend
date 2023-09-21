import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Car } from './car.entity';
import { Model } from 'mongoose';
import { User } from 'src/user/user.entity';

@Injectable()
export class CarRepository {
  private readonly logger = new Logger(CarRepository.name);

  constructor(@InjectModel(Car.name) private carModel: Model<Car>) {}

  async save(cars: Car[]) {
    this.logger.debug('Saving cars', cars);

    await this.carModel.create(cars);
  }

  async find(params: User['config']): Promise<Car[]> {
    const query = {
      postedAt: {
        $gte: new Date(params.searchFrom).getTime(),
      },
      city: {
        $in: params.cities,
      },
      platform: {
        $in: params.platforms,
      },
      brand: {
        $in: params.brands,
      },
      model: {
        $in: params.models,
      },
      price: {
        $gte: params.price.min,
        $lte: params.price.max,
      },
      enginePower: {
        $gte: params.engine.power.min,
        $lte: params.engine.power.max,
      },
      engineVolume: {
        $gte: params.engine.volume.min,
        $lte: params.engine.volume.max,
      },
      engineType: {
        $in: params.engine.types,
      },
      mileage: {
        $gte: params.mileage.min,
        $lte: params.mileage.max,
      },
      transmission: {
        $in: params.transmissions,
      },
      ownersCount: {
        $gte: params.ownersCount.min,
        $lte: params.ownersCount.max,
      },
      condition: {
        $in: params.conditions,
      },
      seller: {
        $in: params.sellers,
      },
      year: {
        $gte: params.year.min,
        $lte: params.year.max,
      },
      back: {
        $in: params.backs,
      },
      color: {
        $in: params.colors,
      },
      drive: {
        $in: params.drives,
      },
      wheel: {
        $in: params.wheels,
      },
    };
    this.logger.debug('Cars find query', query);
    const cars = (await this.carModel.find(query).lean()) as Car[];

    this.logger.debug('Found cars', cars);

    return cars;
  }
}
