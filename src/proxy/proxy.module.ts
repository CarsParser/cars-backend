import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ProxyRepository } from './proxy.repository';
import { ConfigModule } from '@nestjs/config';
import { ElkLogger } from 'src/helpers';

@Module({
  imports: [ConfigModule],
  controllers: [ProxyController],
  providers: [ProxyService, ProxyRepository, ElkLogger],
  exports: [ProxyRepository],
})
export class ProxyModule {}
