import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { City, Platform } from 'src/common';

export class PlatformConfig {
  @ApiProperty({
    default: City.spb,
    enum: City,
    description: 'City',
  })
  @IsEnum(City)
  city: City;

  @ApiProperty({
    default: new Date(),
    type: Date,
    description: 'Last processed record timestamp',
  })
  @IsDate()
  lastProcessedRecordTimestamp: Date;
}

export class PlatformCreateDTO {
  @ApiProperty({
    default: Platform.avito,
    enum: Platform,
    description: 'Platform',
  })
  @IsEnum(Platform)
  name: Platform;

  @ApiProperty({ type: () => [PlatformConfig], description: 'Configuration' })
  @ValidateNested({ each: true })
  config: PlatformConfig[];
}

export class PlatformUpdateDTO {
  @ApiProperty({
    default: Platform.avito,
    enum: Platform,
    description: 'Platform',
  })
  @IsEnum(Platform)
  name: Platform;

  @ApiProperty({ type: () => [PlatformConfig], description: 'Configuration' })
  @ValidateNested({ each: true })
  @IsOptional()
  config?: PlatformConfig[];
}
