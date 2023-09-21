import { Injectable } from '@nestjs/common';
import { AvitoRepository } from './avito/avito.repository';
import { PlatformRepository } from './platform.repository';
import { Platform } from 'src/common';

@Injectable()
export class PlatformsFactory {
  constructor(private avitoRepository: AvitoRepository) {}

  create(platform: Platform): PlatformRepository {
    switch (platform) {
      case Platform.avito: {
        return this.avitoRepository;
      }
      default: {
        return this.avitoRepository;
      }
    }
  }
}
