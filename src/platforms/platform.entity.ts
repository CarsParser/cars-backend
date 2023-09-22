import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { City, Platform as PlatformName } from 'src/common';

export type PlatformDocument = HydratedDocument<Platform>;

export class Config {
  @Prop({ required: true, enum: City })
  city: City;

  @Prop({ required: true, default: new Date(), type: () => Date })
  lastProcessedRecordTimestamp: Date;
}

@Schema()
export class Platform {
  @Prop({ required: true, enum: PlatformName })
  name: PlatformName;

  @Prop({ required: true, type: () => [Config] })
  config: Config[];
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);
