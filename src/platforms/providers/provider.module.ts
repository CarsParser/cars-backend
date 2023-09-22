import { Module } from '@nestjs/common';
import { AvitoModule } from './avito/avito.module';
import { ProviderFactory } from './provider.factory';

@Module({
  imports: [AvitoModule],
  providers: [ProviderFactory],
  exports: [ProviderFactory],
})
export class ProviderModule {}
