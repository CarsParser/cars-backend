import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotifierModule } from './notifier/notifier.module';
import { PlatformsModule } from './platforms/platforms.module';
import { CarModule } from './car/car.module';
import { RedisModule } from './libs/redis.module';
import { ProxyModule } from './proxy/proxy.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule,
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
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          pinoHttp: { level: config.get('DEBUG') ? 'debug' : 'info' },
        };
      },
    }),
    ScheduleModule.forRoot(),
    UserModule,
    NotifierModule,
    PlatformsModule,
    CarModule,
    ProxyModule,
  ],
})
export class AppModule {}
