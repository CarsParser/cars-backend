import { Module, forwardRef } from '@nestjs/common';
import { CarRepository } from './car.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, CarSchema } from './car.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ProviderModule } from 'src/platforms/providers/provider.module';
import { CarProducerService } from './car.producer.service';
import { CarConsumerController } from './car.consumer.controller';
import { PlatformsModule } from 'src/platforms/platforms.module';
import { ProxyModule } from 'src/proxy/proxy.module';
import { City } from 'src/common';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Car.name, schema: CarSchema }]),
    forwardRef(() => ProviderModule),
    PlatformsModule,
    ProxyModule,
    ConfigModule,
  ],
  controllers: [CarConsumerController],
  providers: [
    CarRepository,
    CarProducerService,
    {
      provide: 'CAR_SERVICE',
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.KAFKA,
          options: {
            producer: {
              createPartitioner:
                () =>
                ({ topic, message }) => {
                  if (topic === 'load_cars') {
                    const data = JSON.parse(message.value as string);

                    switch (data.city as City) {
                      case City.spb: {
                        return 0;
                      }
                      case City.arkh: {
                        return 1;
                      }
                      case City.ekb: {
                        return 2;
                      }
                      case City.kazan: {
                        return 3;
                      }
                      case City.msk: {
                        return 4;
                      }
                      case City.omsk: {
                        return 5;
                      }
                      case City.rostov: {
                        return 6;
                      }
                      case City.samara: {
                        return 7;
                      }
                    }
                  }

                  return 0;
                },
            },
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
