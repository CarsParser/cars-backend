import { Module } from '@nestjs/common';
import { CarRepository } from './car.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, CarSchema } from './car.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ProviderModule } from 'src/platforms/providers/provider.module';
import { CarProducerService } from './car.producer.service';
import { CarConsumerController } from './car.consumer.controller';
import { PlatformsModule } from 'src/platforms/platforms.module';
import { BlockerService } from 'src/helpers/blocker.service';
import { ProxyModule } from 'src/proxy/proxy.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Car.name, schema: CarSchema }]),
    ProviderModule,
    PlatformsModule,
    ProxyModule,
    ConfigModule,
  ],
  controllers: [CarConsumerController],
  providers: [
    BlockerService,
    CarRepository,
    CarProducerService,
    {
      provide: 'CAR_SERVICE',
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'cars',
              brokers: [
                `${configService.get('KAFKA_HOST')}:${configService.get(
                  'KAFKA_PORT',
                )}`,
              ],
            },
            consumer: {
              groupId: 'car-consumer',
            },
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CarRepository],
})
export class CarModule {}
