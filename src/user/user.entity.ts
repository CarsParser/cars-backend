import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  City,
  Condition,
  Drive,
  EngineType,
  Platform,
  Seller,
  Transmission,
  Wheel,
} from 'src/common';

export type UserDocument = HydratedDocument<User>;

export class PriceRange {
  @Prop({ required: true, default: 0 })
  min: number;

  @Prop({ required: true, default: 30_000_000 })
  max: number;
}

export class EngineVolumeRange {
  @Prop({ required: true, default: 0 })
  min: number;

  @Prop({ required: true, default: 130 })
  max: number;
}

export class EnginePowerRange {
  @Prop({ required: true, default: 0 })
  min: number;

  @Prop({ required: true, default: 2000 })
  max: number;
}

export class Engine {
  @Prop({ required: true, type: () => EngineVolumeRange })
  volume: EngineVolumeRange;

  @Prop({ required: true, type: () => EnginePowerRange })
  power: EnginePowerRange;

  @Prop({
    required: true,
    type: () => [EngineType],
    default: [EngineType.disel],
  })
  types: EngineType[];
}

export class MilegeRange {
  @Prop({ required: true, default: 0 })
  min: number;

  @Prop({ required: true, default: 1_000_000 })
  max: number;
}

export class OwnersCountRange {
  @Prop({ required: true, default: 0 })
  min: number;

  @Prop({ required: true, default: 100 })
  max: number;
}

export class YearRange {
  @Prop({ required: true, default: 1900 })
  min: number;

  @Prop({ required: true, default: 2100 })
  max: number;
}

export class Config {
  @Prop({ default: [Platform.avito], required: true, type: () => [Platform] })
  platforms: Platform[];

  @Prop({ default: [City.spb], required: true, type: () => [City] })
  cities: City[];

  @Prop({ default: new Date(), required: true, type: () => Date })
  searchFrom: Date;

  @Prop({ required: true, type: () => PriceRange })
  price: PriceRange;

  @Prop({ required: true, default: ['bmw'], type: () => String })
  brands: string[];

  @Prop({ required: true, default: ['x5'], type: () => String })
  models: string[];

  @Prop({ required: true, type: () => Engine })
  engine: Engine;

  @Prop({ required: true, type: () => MilegeRange })
  mileage: MilegeRange;

  @Prop({
    required: true,
    default: [Transmission.auto],
    type: () => [Transmission],
  })
  transmissions: Transmission[];

  @Prop({ required: true, type: () => OwnersCountRange })
  ownersCount: OwnersCountRange;

  @Prop({ required: true, default: [Condition.hit], type: () => [Condition] })
  conditions: Condition[];

  @Prop({ required: true, default: [Seller.dealer], type: () => [Seller] })
  sellers: Seller[];

  @Prop({ required: true, type: () => YearRange })
  year: YearRange;

  @Prop({ required: true, default: ['sedan'], type: () => [String] })
  backs: string[];

  @Prop({ required: true, default: ['red'], type: () => [String] })
  colors: string[];

  @Prop({ required: true, default: [Drive.back], type: () => [Drive] })
  drives: Drive[];

  @Prop({ required: true, default: [Wheel.right], type: () => [Wheel] })
  wheels: Wheel[];
}

@Schema({
  autoIndex: true,
})
export class User {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, type: () => Config })
  config: Config;

  @Prop({ default: true, required: true })
  monitor: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ monitor: 1 });
