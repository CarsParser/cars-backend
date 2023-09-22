import { Module } from '@nestjs/common';
import { AvitoRepository } from './avito.repository';
import { HttpModule } from '@nestjs/axios';
import { ProxyModule } from 'src/proxy/proxy.module';

@Module({
  imports: [HttpModule, ProxyModule],
  providers: [AvitoRepository],
  exports: [AvitoRepository],
})
export class AvitoModule {}
