import { Injectable } from '@nestjs/common';
import { PlatformCreateDTO, PlatformUpdateDTO } from './dto/platform.dto';
import { Platform as PlatformName } from 'src/common';
import { Platform } from './platform.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ElkLogger } from 'src/helpers';
import { LogLevel } from 'src/helpers/logger';

@Injectable()
export class PlatformRepository {
  constructor(
    @InjectModel(Platform.name) private platformModel: Model<Platform>,
    private elkLogger: ElkLogger,
  ) {}

  async create(platformCreate: PlatformCreateDTO) {
    const platform = await this.platformModel.create(platformCreate);

    this.elkLogger.log(
      PlatformRepository.name,
      'platform created',
      platform,
      LogLevel.LOW,
    );
  }

  async update(platformUpdate: PlatformUpdateDTO) {
    const updateResults = await this.platformModel.updateOne(
      { name: platformUpdate.name },
      platformUpdate,
    );

    this.elkLogger.log(
      PlatformRepository.name,
      'platform updated',
      updateResults,
      LogLevel.LOW,
    );
  }

  async find(): Promise<Platform[]> {
    const platforms = await this.platformModel.find().lean();

    this.elkLogger.log(
      PlatformRepository.name,
      'platforms found',
      platforms,
      LogLevel.LOW,
    );

    return platforms;
  }

  async findOne(platformName: PlatformName): Promise<Platform> {
    const platform = await this.platformModel
      .findOne({ name: platformName })
      .lean();

    this.elkLogger.log(
      PlatformRepository.name,
      'platform found',
      platform,
      LogLevel.LOW,
    );

    return platform;
  }

  async delete(platform: PlatformName) {
    const deleteResults = await this.platformModel.deleteOne({
      name: platform,
    });

    this.elkLogger.log(
      PlatformRepository.name,
      'platform deleted',
      deleteResults,
      LogLevel.LOW,
    );
  }
}
