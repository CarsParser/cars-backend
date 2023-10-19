import { City, Platform } from 'src/common';
import { ProviderRepository } from '../provider.repository';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Car } from 'src/car/car.entity';
import { CarRepository } from 'src/car/car.repository';

@Injectable()
export class AvitoRepository implements ProviderRepository {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private carRepository: CarRepository,
  ) {}

  async loadCars(city: City): Promise<void> {
    const lastProcessedCars = this.carRepository.findLastProcessedCars(
      city,
      Platform.avito,
    );
    const loadedCars = await this.httpService.axiosRef.post<Car[]>(
      `http://${this.configService.get(
        'AVITO_PARSER_HOST',
      )}:${this.configService.get('AVITO_PARSER_PORT')}/load-cars`,
      {
        city,
        lastProcessedCars,
      },
    );
    console.log('Loaded cars: ', loadedCars.data?.map((car) => car.url));
  }
}
