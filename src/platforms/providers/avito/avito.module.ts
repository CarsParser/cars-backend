import { Module } from '@nestjs/common';
import { AvitoRepository } from './avito.repository';
import { ProxyModule } from 'src/proxy/proxy.module';
import { ConfigModule } from '@nestjs/config';
import { AvitoParserService } from './avito.parse.service';

@Module({
  imports: [ProxyModule, ConfigModule],
  providers: [AvitoRepository, AvitoParserService],
  exports: [AvitoRepository],
})
export class AvitoModule {}
