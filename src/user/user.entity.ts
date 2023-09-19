import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export class Config {
    @Prop()
    brand?: string;
}

export enum Platform {
    avito = 'avito'
}

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true, type: () => Config, default: {} })
    config: Config;

    @Prop({ default: true, required: true })
    monitor: boolean

    @Prop({ default: [Platform.avito], required: true, type: () => [Platform] })
    platforms: Platform[]
}

export const UserSchema = SchemaFactory.createForClass(User);
