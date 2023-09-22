import { Injectable, Logger } from '@nestjs/common';
import { PlatformCreateDTO, PlatformUpdateDTO } from './dto/platform.dto';
import { City, Platform as PlatformName } from 'src/common';
import { Platform } from './platform.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PlatformRepository {
  private readonly logger = new Logger(PlatformRepository.name);

  constructor(
    @InjectModel(Platform.name) private platformModel: Model<Platform>,
  ) {}

  async create(platformCreate: PlatformCreateDTO) {
    const platform = await this.platformModel.create(platformCreate);

    this.logger.debug('Platform created', platform);
  }

  async update(platformUpdate: PlatformUpdateDTO) {
    const updateResults = await this.platformModel.updateOne(
      { name: platformUpdate.name },
      platformUpdate,
    );

    this.logger.debug('Platform updated', updateResults);
  }

  async find(): Promise<Platform[]> {
    const platforms = await this.platformModel.find().lean();

    this.logger.debug('Platforms found', platforms);

    return platforms;
  }

  async findOne(platformName: PlatformName): Promise<Platform> {
    const platform = await this.platformModel
      .findOne({ name: platformName })
      .lean();

    this.logger.debug('Found platform', platform);

    return platform;
  }

  async delete(platform: PlatformName) {
    const deleteResults = await this.platformModel.deleteOne({
      name: platform,
    });

    this.logger.debug('Platform deleted', deleteResults);
  }
}
