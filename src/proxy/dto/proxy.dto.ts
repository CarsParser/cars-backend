import { ApiProperty } from '@nestjs/swagger';
import {
  IsIP,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ProxyAuth {
  @ApiProperty({ default: 'root', description: 'Username' })
  @IsString()
  user: string;

  @ApiProperty({ default: 'password', description: 'Password' })
  @IsString()
  password: string;
}

export class ProxyDTO {
  @ApiProperty({ default: '0.0.0.0', description: 'Proxy host' })
  @IsIP()
  host: string;

  @ApiProperty({ default: 5334, description: 'Proxy port' })
  @IsNumber()
  port: number;

  @ApiProperty({ description: 'Proxy auth', type: () => ProxyAuth })
  @IsOptional()
  @ValidateNested()
  auth?: ProxyAuth;
}
