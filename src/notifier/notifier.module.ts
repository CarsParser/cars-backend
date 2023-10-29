import { Module } from '@nestjs/common';
import { NotifierProducerService } from './notifier.producer.service';
import { UserModule } from '../user/user.module';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotifierConsumerController } from './notifier.consumer.controller';
import { CarModule } from 'src/car/car.module';
import { ElkLogger } from 'src/helpers';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [UserModule, CarModule, ConfigModule, ClientModule],
  controllers: [NotifierConsumerController],
  providers: [
    ElkLogger,
    NotifierProducerService,
    {
      provide: 'NOTIFIER_SERVICE',
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
              groupId: 'notifier-consumer',
            },
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class NotifierModule {}
