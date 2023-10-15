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
  BackType,
  Color,
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
    default: Object.keys(EngineType),
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
    default: Object.keys(Platform),
    isArray: true,
    minItems: 1,
    enum: Platform,
    description: 'Platforms to search',
  })
  @IsEnum(Platform, { each: true })
  @ArrayMinSize(1)
  platforms: Platform[];

  @ApiProperty({
    default: Object.keys(City),
    isArray: true,
    minItems: 1,
    enum: City,
    description: 'Cities to search',
  })
  @IsEnum(City, { each: true })
  @ArrayMinSize(1)
  cities: City[];

  @ApiProperty({ type: () => PriceRange, description: 'Price range' })
  @ValidateNested()
  price: PriceRange;

  @ApiProperty({
    default: ['BMW'],
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
    default: Object.keys(Transmission),
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
    default: Object.keys(Condition),
    isArray: true,
    minItems: 1,
    enum: Condition,
    description: 'Condition to search',
  })
  @IsEnum(Condition, { each: true })
  @ArrayMinSize(1)
  conditions: Condition[];

  @ApiProperty({
    default: Object.keys(Seller),
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
    default: Object.keys(BackType),
    isArray: true,
    minItems: 1,
    enum: BackType,
    description: 'Backs to search',
  })
  @IsArray()
  @IsEnum(BackType, { each: true })
  @ArrayMinSize(1)
  backs: BackType[];

  @ApiProperty({
    default: Object.keys(Color),
    isArray: true,
    minItems: 1,
    enum: Color,
    description: 'Colors to search',
  })
  @IsArray()
  @IsEnum(Color, { each: true })
  @ArrayMinSize(1)
  @ArrayMinSize(1)
  colors: Color[];

  @ApiProperty({
    default: Object.keys(Drive),
    isArray: true,
    minItems: 1,
    enum: Drive,
    description: 'Drives to search',
  })
  @IsEnum(Drive, { each: true })
  @ArrayMinSize(1)
  drives: Drive[];

  @ApiProperty({
    default: Object.keys(Wheel),
    isArray: true,
    minItems: 1,
    enum: Wheel,
    description: 'Wheels to search',
  })
  @IsEnum(Wheel, { each: true })
  @ArrayMinSize(1)
  wheels: Wheel[];

  @ApiProperty({
    default: false,
    description: 'To watch new add or all',
  })
  @IsBoolean()
  newAdds: boolean;
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
