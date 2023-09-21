import { Module } from '@nestjs/common';
import { NotifierProducerService } from './notifier.producer.service';
import { UserModule } from '../user/user.module';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotifierConsumerController } from './notifier.consumer.controller';
import { BlockerService } from 'src/helpers/blocker.service';
import { CarModule } from 'src/car/car.module';

@Module({
  imports: [UserModule, CarModule, ConfigModule],
  controllers: [NotifierConsumerController],
  providers: [
    BlockerService,
    BlockerService,
    NotifierProducerService,
    {
      provide: 'NOTIFIER_SERVICE',
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.KAFKA,
          options: {
            producer: {
              createPartitioner:
                () =>
                ({ topic, message }) => {
                  if (topic === 'cars_notification') {
                    const user = JSON.parse(message.value as string);

                    return (
                      user.id
                        .split('')
                        .map((c) => c.toUpperCase().charCodeAt(0))
                        .reduce((prev, curr) => prev + curr, 0) % 10
                    );
                  }

                  return 0;
                },
            },
            client: {
              clientId: 'notifier',
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
