import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PickType, IntersectionType, PartialType, OmitType } from "@nestjs/mapped-types";

export class Config {
  @ApiProperty({ default: 'BMW', description: 'Brand of car' })
  @IsString()
  @IsOptional()
  brand?: string
}

export enum Platform {
  avito = 'avito'
}

export class UserDTO {
  @ApiProperty({ default: '123', description: 'User id' })
  @IsString()
  id: string;

  @ApiProperty({ default: true, description: 'Monitor for updates' })
  @IsBoolean()
  monitor: boolean;

  @ApiProperty({ default: [Platform.avito], isArray: true, enum: Platform, description: 'Platforms to search' })
  @IsEnum(Platform, { each: true })
  platforms: Platform[];

  @ApiProperty({ default: {}, type: () => Config, description: 'Monitor configuration' })
  @ValidateNested()
  config: Config;
}

export class UserUpdateDTO extends IntersectionType(PickType(UserDTO, ['id'] as const), PartialType(OmitType(UserDTO, ['id' as const]))) { }
