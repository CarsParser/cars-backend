import { Module } from '@nestjs/common';
import { TgService } from './tg/tg.service';
import { HttpModule } from '@nestjs/axios';
import { ElkLogger } from '../helpers';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TgService, ElkLogger],
  exports: [TgService],
})
export class ClientModule {}
