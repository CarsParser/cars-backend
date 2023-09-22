import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SearchCarsData } from 'src/common';
import { FindResponse, ProviderRepository } from '../provider.repository';

@Injectable()
export class AvitoRepository extends ProviderRepository {
  constructor(private readonly httpService: HttpService) {
    super();
  }

  async find(params: SearchCarsData): Promise<FindResponse> {
    params;
    return {
      cars: [],
      lastProcessedRecordTimestamp: new Date().toISOString(),
    };
  }
}
