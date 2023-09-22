import { Injectable } from '@nestjs/common';
import { AvitoRepository } from './avito/avito.repository';
import { ProviderRepository } from './provider.repository';
import { Platform } from 'src/common';

@Injectable()
export class ProviderFactory {
  constructor(private avitoRepository: AvitoRepository) {}

  create(platform: Platform): ProviderRepository {
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
