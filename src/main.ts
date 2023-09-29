import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Proxy } from './proxy/proxy.repository';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //app.useLogger(app.get(Logger));
  const configService = app.get<ConfigService>(ConfigService);

  // Init proxy
  const hidden = configService.get('HIDDEN');

  if (hidden) {
    const redisService = app.get<Redis>('REDIS');
    const proxyList = await redisService.lrange('proxy', 0, -1);
    if (!proxyList.length) {
      const defaultProxyList: Proxy[] = [
        {
          host: '195.96.150.26',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.52.13.132',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.52.4.38',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.52.13.49',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.150.131',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.18.122.79',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.141.160',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.18.100.80',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.18.98.174',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.18.100.37',
          port: 4448,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.141.95',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.52.4.207',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.150.184',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.141.239',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.52.13.240',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.141.72',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.150.96',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.52.4.61',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '195.96.141.136',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
        {
          host: '212.18.98.13',
          port: 5238,
          auth: {
            user: 'user136439',
            password: 'xawrob',
          },
        },
      ];
      await redisService.rpush(
        'proxy',
        ...defaultProxyList.map((proxy) => JSON.stringify(proxy)),
      );
    }
  }

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
