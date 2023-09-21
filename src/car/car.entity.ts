import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  Platform,
  City,
  Transmission,
  Condition,
  Seller,
  Drive,
  Wheel,
  EngineType,
} from 'src/common';

export type CarDocument = HydratedDocument<Car>;

@Schema({
  autoIndex: true,
})
export class Car {
  @Prop({ required: true, enum: Platform })
  platform: Platform;

  @Prop({ required: true, enum: City })
  city: City;

  @Prop({ required: true, type: Date })
  postedAt: Date;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  engineVolume: number;

  @Prop({ required: true })
  enginePower: number;

  @Prop({ required: true, enum: EngineType })
  engineType: EngineType;

  @Prop({ required: true })
  mileage: number;

  @Prop({ required: true, enum: Transmission })
  transmission: Transmission;

  @Prop({ required: true })
  ownersCount: number;

  @Prop({ required: true, enum: Condition })
  condition: Condition;

  @Prop({ required: true, enum: Seller })
  seller: Seller;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  back: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true, enum: Drive })
  drive: Drive;

  @Prop({ required: true, enum: Wheel })
  wheel: Wheel;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  costDifference: number;

  @Prop({ required: true, default: true })
  newAdd: boolean;
}

export const CarSchema = SchemaFactory.createForClass(Car);

CarSchema.index({ postedAt: 1, city: 1, platform: 1, brand: 1 });
CarSchema.index({ city: 1 });
