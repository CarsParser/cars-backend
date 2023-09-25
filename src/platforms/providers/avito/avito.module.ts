import { Module } from '@nestjs/common';
import { AvitoRepository } from './avito.repository';
import { ConfigModule } from '@nestjs/config';
import { AvitoParserService } from './avito.parse.service';

@Module({
  imports: [ConfigModule],
  providers: [AvitoRepository, AvitoParserService],
  exports: [AvitoRepository],
})
export class AvitoModule {}
