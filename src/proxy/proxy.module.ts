import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyRepository } from './proxy.repository';

@Module({
  controllers: [ProxyController],
  providers: [ProxyService, ProxyRepository],
  exports: [ProxyRepository],
})
export class ProxyModule {}
