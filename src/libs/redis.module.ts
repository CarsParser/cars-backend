import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST'),
          port: parseInt(configService.get('REDIS_PORT') || '6379'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
