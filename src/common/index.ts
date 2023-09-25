import { Car } from 'src/car/car.entity';
import { Proxy } from 'src/proxy/proxy.repository';

export enum Platform {
  avito = 'avito',
}

export enum City {
  spb = 'spb',
  msk = 'msk',
  samara = 'samara',
  ekb = 'ekb',
  arkh = 'arkh',
  rostov = 'rostov',
  omsk = 'omsk',
  kazan = 'kazan',
}

export enum Transmission {
  auto = 'auto',
  robot = 'robot',
  vary = 'vary',
  mechanic = 'mechanic',
}

export enum Condition {
  hit = 'hit',
  notHit = 'notHit',
}

export enum Seller {
  dealer = 'dealer',
  private = 'private',
}

export enum Drive {
  front = 'front',
  back = 'back',
  full = 'full',
}

export enum Wheel {
  right = 'right',
  left = 'left',
}

export enum EngineType {
  disel = 'disel',
  petrol = 'petrol',
  hybrid = 'hybrid',
  electric = 'electric',
}

export interface SearchCarsData {
  platform: Platform;
  city: City;
  lastProcessedCars: Car[];
  heartbeat: () => Promise<void>;
  proxy?: Proxy;
}
