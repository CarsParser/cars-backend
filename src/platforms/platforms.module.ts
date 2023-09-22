import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Platform, PlatformSchema } from './platform.entity';
import { PlatformService } from './platform.service';
import { PlatformRepository } from './platform.repository';
import { PlatformController } from './plarform.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformSchema },
    ]),
  ],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformRepository],
  exports: [PlatformRepository],
})
export class PlatformsModule {}
