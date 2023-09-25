import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { minutesToMilliseconds } from 'date-fns';

async function bootstrap() {
  const logLevel: LogLevel[] = ['log', 'error', 'warn'];

  if (process.env.DEBUG) {
    logLevel.push('debug');
  }
  const app = await NestFactory.create(AppModule, {
    logger: logLevel,
  });
  const configService = app.get<ConfigService>(ConfigService);

  app.useGlobalPipes(new ValidationPipe());
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [
          `${configService.get('KAFKA_HOST')}:${configService.get(
            'KAFKA_PORT',
          )}`,
        ],
      },
      consumer: {
        groupId: `cars-group`,
        // sessionTimeout должен быть чуть больше чем в 3 раза heartbeatInterval
        sessionTimeout: minutesToMilliseconds(1 * 1.5 + 1),
        heartbeatInterval: minutesToMilliseconds(1 * 0.5),
        // rebalanceTimeout должен быть равен sessionTimeout
        rebalanceTimeout: minutesToMilliseconds(1 * 1.5 + 1),
      },
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Cars parser')
    .setDescription('The cars API description')
    .setVersion('1.0')
    .addTag('cars_parser')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  await app.listen(3000);
}

bootstrap();
