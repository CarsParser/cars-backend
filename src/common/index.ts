export enum Platform {
  avito = 'avito',
}

export enum City {
  spb = 'spb',
  msk = 'msk',
}

export enum Transmission {
  auto = 'auto',
  akpp = 'akpp',
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
  lastProcessedRecordTimestamp: string;
}
