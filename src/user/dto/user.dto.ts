import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
import { v4 as uuidv4 } from 'uuid';

export class PriceRange {
  @ApiProperty({ default: 0, description: 'Min price value' })
  @IsNumber()
  @IsPositive()
  min: number;

  @ApiProperty({ default: 30_000_000, description: 'Max price value' })
  @IsNumber()
  @IsPositive()
  max: number;
}

export class EngineVolumeRange {
  @ApiProperty({ default: 0, description: 'Min engine volume value' })
  @IsNumber()
  @IsPositive()
  min: number;

  @ApiProperty({ default: 130, description: 'Max engine volume value' })
  @IsNumber()
  @IsPositive()
  max: number;
}

export class EnginePowerRange {
  @ApiProperty({ default: 0, description: 'Min engine power value' })
  @IsNumber()
  @IsPositive()
  min: number;

  @ApiProperty({ default: 1_500, description: 'Max engine power value' })
  @IsNumber()
  @IsPositive()
  max: number;
}

export class MilegeRange {
  @ApiProperty({ default: 0, description: 'Min milege value' })
  @IsNumber()
  @IsPositive()
  min: number;

  @ApiProperty({ default: 1_000_000, description: 'Max milege value' })
  @IsNumber()
  @IsPositive()
  max: number;
}

export class OwnersCountRange {
  @ApiProperty({ default: 0, description: 'Min owners count value' })
  @IsNumber()
  @IsPositive()
  min: number;

  @ApiProperty({ default: 100, description: 'Max owners count value' })
  @IsNumber()
  @IsPositive()
  max: number;
}

export class YeerRange {
  @ApiProperty({ default: 1900, description: 'Min year value' })
  @IsNumber()
  @IsPositive()
  min: number;

  @ApiProperty({ default: 2100, description: 'Max yaer value' })
  @IsNumber()
  @IsPositive()
  max: number;
}

export class Engine {
  @ApiProperty({ type: () => EngineVolumeRange, description: 'Volume range' })
  @ValidateNested()
  volume: EngineVolumeRange;

  @ApiProperty({ type: () => EnginePowerRange, description: 'Power range' })
  @ValidateNested()
  power: EnginePowerRange;

  @ApiProperty({
    default: [EngineType.disel],
    isArray: true,
    minItems: 1,
    enum: EngineType,
    description: 'Engine types to search',
  })
  @IsEnum(EngineType, { each: true })
  types: EngineType[];
}

export class Config {
  @ApiProperty({
    default: [Platform.avito],
    isArray: true,
    minItems: 1,
    enum: Platform,
    description: 'Platforms to search',
  })
  @IsEnum(Platform, { each: true })
  @ArrayMinSize(1)
  platforms: Platform[];

  @ApiProperty({
    default: [City.spb],
    isArray: true,
    minItems: 1,
    enum: City,
    description: 'Cities to search',
  })
  @IsEnum(City, { each: true })
  @ArrayMinSize(1)
  cities: City[];

  @ApiProperty({
    default: new Date(),
    type: Date,
    description: 'Search from datetime',
  })
  @IsDate()
  searchFrom: Date;

  @ApiProperty({ type: () => PriceRange, description: 'Price range' })
  @ValidateNested()
  price: PriceRange;

  @ApiProperty({
    default: ['bmw'],
    isArray: true,
    minItems: 1,
    description: 'Brands to search',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  brands: string[];

  @ApiProperty({
    default: ['x5'],
    isArray: true,
    minItems: 1,
    description: 'Models to search',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  models: string[];

  @ApiProperty({ type: () => Engine, description: 'Engine settings' })
  @ValidateNested()
  engine: Engine;

  @ApiProperty({ type: () => MilegeRange, description: 'Milage range' })
  @ValidateNested()
  mileage: MilegeRange;

  @ApiProperty({
    default: [Transmission.auto],
    isArray: true,
    minItems: 1,
    enum: Transmission,
    description: 'Transmitions to search',
  })
  @IsEnum(Transmission, { each: true })
  @ArrayMinSize(1)
  transmissions: Transmission[];

  @ApiProperty({
    type: () => OwnersCountRange,
    description: 'Owners count range',
  })
  @ValidateNested()
  @ArrayMinSize(1)
  ownersCount: OwnersCountRange;

  @ApiProperty({
    default: [Condition.hit],
    isArray: true,
    minItems: 1,
    enum: Condition,
    description: 'Condition to search',
  })
  @IsEnum(Condition, { each: true })
  @ArrayMinSize(1)
  conditions: Condition[];

  @ApiProperty({
    default: [Seller.dealer],
    isArray: true,
    minItems: 1,
    enum: Seller,
    description: 'Seller to search',
  })
  @IsEnum(Seller, { each: true })
  @ArrayMinSize(1)
  sellers: Seller[];

  @ApiProperty({ type: () => YeerRange, description: 'Year range' })
  @ValidateNested()
  year: YeerRange;

  @ApiProperty({
    default: ['sedan'],
    isArray: true,
    minItems: 1,
    description: 'Backs to search',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  backs: string[];

  @ApiProperty({
    default: ['red'],
    isArray: true,
    minItems: 1,
    description: 'Colors to search',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  colors: string[];

  @ApiProperty({
    default: [Drive.front],
    isArray: true,
    minItems: 1,
    enum: Drive,
    description: 'Drives to search',
  })
  @IsEnum(Drive, { each: true })
  @ArrayMinSize(1)
  drives: Drive[];

  @ApiProperty({
    default: [Wheel.left],
    isArray: true,
    minItems: 1,
    enum: Wheel,
    description: 'Wheels to search',
  })
  @IsEnum(Wheel, { each: true })
  @ArrayMinSize(1)
  wheels: Wheel[];
}

export class UserDTO {
  @ApiProperty({ default: uuidv4(), description: 'User id' })
  @IsString()
  id: string;

  @ApiProperty({ default: true, description: 'Monitor for updates' })
  @IsBoolean()
  monitor: boolean;

  @ApiProperty({ type: () => Config, description: 'Monitor configuration' })
  @ValidateNested()
  config: Config;
}

export class UserUpdateDTO {
  @ApiProperty({ default: uuidv4(), description: 'User id' })
  @IsString()
  id: string;

  @ApiProperty({ default: true, description: 'Monitor for updates' })
  @IsBoolean()
  @IsOptional()
  monitor?: boolean;

  @ApiProperty({ type: () => Config, description: 'Monitor configuration' })
  @ValidateNested()
  @IsOptional()
  config?: Config;
}
