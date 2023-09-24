import { Car } from 'src/car/car.entity';
import { SearchCarsData } from 'src/common';

export interface FindResponse {
  cars: Car[];
}

export abstract class ProviderRepository {
  abstract find(params: SearchCarsData): Promise<FindResponse>;
}
