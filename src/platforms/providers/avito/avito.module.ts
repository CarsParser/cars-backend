import { Module, forwardRef } from '@nestjs/common';
import { AvitoRepository } from './avito.repository';
import { ConfigModule } from '@nestjs/config';
import { ProxyModule } from 'src/proxy/proxy.module';
import { CarModule } from 'src/car/car.module';
import { ElkLogger } from 'src/helpers';

@Module({
  imports: [ConfigModule, ProxyModule, forwardRef(() => CarModule)],
  providers: [AvitoRepository, ElkLogger],
  exports: [AvitoRepository],
})
export class AvitoModule {}
