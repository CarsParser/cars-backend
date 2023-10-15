import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Platform, PlatformSchema } from './platform.entity';
import { PlatformService } from './platform.service';
import { PlatformRepository } from './platform.repository';
import { PlatformController } from './plarform.controller';
import { ConfigModule } from '@nestjs/config';
import { ElkLogger } from 'src/helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformSchema },
    ]),
    ConfigModule,
  ],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformRepository, ElkLogger],
  exports: [PlatformRepository],
})
export class PlatformsModule {}
