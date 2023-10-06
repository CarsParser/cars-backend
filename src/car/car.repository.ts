import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Car } from './car.entity';
import { Model } from 'mongoose';
import { User } from 'src/user/user.entity';
import { City, Platform } from 'src/common';
import { subMinutes } from 'date-fns';

@Injectable()
export class CarRepository {
  private readonly logger = new Logger(CarRepository.name);

  constructor(@InjectModel(Car.name) private carModel: Model<Car>) {}

  async save(cars: Car[]) {
    this.logger.debug('Saving cars', cars);

    await this.carModel.create(cars);
  }

  async find(user: User): Promise<Car[]> {
    const { config: params } = user;
    const query = {
      postedAt: {
        $gte: user.lastWatchedCars?.lastWatchedCarDateTime
          ? new Date(user.lastWatchedCars?.lastWatchedCarDateTime).getTime()
          : subMinutes(new Date(), 1),
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

    this.logger.debug(
      `City ${city} platform ${platform} last posted at ${lastCar.postedAt.toISOString()}`,
    );

    const lastProcessedCars = await this.carModel
      .find({ postedAt: lastCar.postedAt })
      .select({ postedAt: 1, url: 1 })
      .lean();

    this.logger.debug(`City ${city} platform ${platform}`, {
      lastProcessedCars,
    });

    return lastProcessedCars;
  }
}
