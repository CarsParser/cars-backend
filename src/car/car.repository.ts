import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Car } from './car.entity';
import { Model } from 'mongoose';
import { User } from 'src/user/user.entity';
import { City, Platform } from 'src/common';
import { differenceInMinutes, subMinutes } from 'date-fns';
import { ElkLogger } from 'src/helpers';
import { LogLevel } from 'src/helpers/logger';

@Injectable()
export class CarRepository {
  constructor(
    @InjectModel(Car.name) private carModel: Model<Car>,
    private elkLogger: ElkLogger,
  ) {}

  async cleanCars(date: Date) {
    const deleteResult = await this.carModel.deleteMany({
      postedAt: {
        $lte: date.getTime(),
      },
    });

    this.elkLogger.log(
      CarRepository.name,
      'cars cleaned',
      deleteResult,
      LogLevel.LOW,
    );
  }

  async save(cars: Car[]) {
    await this.carModel.create(cars);
    this.elkLogger.log(CarRepository.name, 'cars saved', cars, LogLevel.LOW);
  }

  async find(user: User): Promise<Car[]> {
    const { config: params } = user;
    const query = {
      postedAt: {
        $gte: subMinutes(
          new Date(user.lastWatchedCars?.lastWatchedCarDateTime),
          2,
        ).getTime(),
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
      url: {
        $nin: user.lastWatchedCars.lastWatchedCarIds,
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
    if (params.newAdds) {
      query['newAdd'] = true;
    }
    const cars = (await this.carModel.find(query).lean()) as Car[];
    this.elkLogger.log(CarRepository.name, 'finding cars', query, LogLevel.LOW);

    this.elkLogger.log(CarRepository.name, 'found cars', cars, LogLevel.LOW);

    return cars;
  }

  async findLastProcessedCars(
    city: City,
    platform: Platform,
  ): Promise<Pick<Car, 'postedAt' | 'url'>[]> {
    const lastCar = await this.carModel
      .findOne({ city, platform })
      .sort({ postedAt: -1 })
      .select({ postedAt: 1 })
      .limit(1)
      .lean();

    if (!lastCar) {
      return [];
    }

    this.elkLogger.log(
      CarRepository.name,
      'finding last processed cars',
      { city, platform, lastCar },
      LogLevel.LOW,
    );

    if (differenceInMinutes(new Date(), lastCar.postedAt) >= 5) {
      return [];
    }

    const lastProcessedCars = await this.carModel
      .find({ postedAt: lastCar.postedAt })
      .select({ postedAt: 1, url: 1 })
      .lean();

    this.elkLogger.log(CarRepository.name, 'found last processed cars', {
      city,
      platform,
      lastProcessedCars,
    });

    return lastProcessedCars;
  }
}
