import { Module, forwardRef } from '@nestjs/common';
import { AvitoRepository } from './avito.repository';
import { ConfigModule } from '@nestjs/config';
import { ProxyModule } from 'src/proxy/proxy.module';
import { CarModule } from 'src/car/car.module';

@Module({
  imports: [ConfigModule, ProxyModule, forwardRef(() => CarModule)],
  providers: [AvitoRepository],
  exports: [AvitoRepository],
})
export class AvitoModule {}
