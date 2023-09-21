import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotifierModule } from './notifier/notifier.module';
import { PlatformsModule } from './platforms/platforms.module';
import { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';
import { CarModule } from './car/car.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: parseInt(configService.get('REDIS_PORT') || '6379'),
          },
        }),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${configService.get(
          'MONGO_USERNAME',
        )}:${configService.get('MONGO_PASSWORD')}@${configService.get(
          'MONGO_HOST',
        )}:${configService.get('MONGO_PORT')}`,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    UserModule,
    NotifierModule,
    PlatformsModule,
    CarModule,
  ],
})
export class AppModule {}
