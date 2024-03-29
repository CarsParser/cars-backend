import { Car } from 'src/car/car.entity';

export enum Platform {
  avito = 'avito',
}

export enum City {
  spb = 'spb',
  msk = 'msk',
  krasnodar = 'krasnodar',
  sverdlovsk = 'sverdlovsk',
  rostov = 'rostov',
  bashkortostan = 'bashkortostan',
  kazan = 'kazan',
  chelyabinsk = 'chelyabinsk',
  dagestan = 'dagestan',
  samara = 'samara',
  nizhniy = 'nizhniy',
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
}

export enum BackType {
  sedan = 'sedan',
  offroadThreeDoors = 'offroadThreeDoors',
  offroadFiveDoors = 'offroadFiveDoors',
  universal = 'universal',
  hatchbackThreeDoors = 'hatchbackThreeDoors',
  hatchbackFiveDoors = 'hatchbackFiveDoors',
  coupe = 'coupe',
  minivan = 'minivan',
  minibus = 'minibus',
  liftback = 'liftback',
  pickup = 'pickup',
  van = 'van',
  cabrio = 'cabrio',
}

export enum Color {
  white = 'white',
  gray = 'gray',
  silver = 'silver',
  black = 'black',
  brown = 'brown',
  gold = 'gold',
  beige = 'beige',
  red = 'red',
  vinous = 'vinous',
  orange = 'orange',
  yellow = 'yellow',
  green = 'green',
  lightBlue = 'lightBlue',
  blue = 'blue',
  violet = 'violet',
  purple = 'purple',
  pink = 'pink',
}

export type CheapCar = Pick<
  Car,
  'brand' | 'model' | 'price' | 'url' | 'costDifference'
>;
