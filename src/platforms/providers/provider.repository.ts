import { City } from 'src/common';

export abstract class ProviderRepository {
  abstract loadCars(city: City): Promise<void>;
}
