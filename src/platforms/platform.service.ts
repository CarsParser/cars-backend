import { Injectable } from '@nestjs/common';
import { PlatformCreateDTO, PlatformUpdateDTO } from './dto/platform.dto';
import { Platform } from 'src/common';
import { PlatformRepository } from './platform.repository';

@Injectable()
export class PlatformService {
  constructor(private platformRepository: PlatformRepository) {}

  async create(platformCreate: PlatformCreateDTO) {
    return this.platformRepository.create(platformCreate);
  }

  async update(platformUpdate: PlatformUpdateDTO) {
    return this.platformRepository.update(platformUpdate);
  }

  async find() {
    return this.platformRepository.find();
  }

  async delete(platform: Platform) {
    return this.platformRepository.delete(platform);
  }
}
