import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Car, IFindParams, PlatformRepository } from '../platform.repository';

@Injectable()
export class AvitoRepository extends PlatformRepository {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async find(params: IFindParams): Promise<Car[]> {
    params;
    return [
      {
        price: 1_000_000,
        brand: 'BMW',
        link: 'https://ya.ru',
        photo: 'https://ya.ru',
      },
    ];
  }
}
