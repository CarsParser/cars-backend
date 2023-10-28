import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserRepository } from '../user/user.repository';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { BlockerFunction, ElkLogger, blocker } from 'src/helpers';
import Redis from 'ioredis';
import { LogLevel } from 'src/helpers/logger';

@Injectable()
export class NotifierProducerService {
  private blocker?: BlockerFunction;

  constructor(
    private userRepository: UserRepository,
    @Inject('NOTIFIER_SERVICE') private client: ClientKafka,
    private configService: ConfigService,
    @Inject('REDIS') private readonly redis: Redis,
    private elkLogger: ElkLogger,
  ) {
    if (!this.blocker) {
      this.blocker = blocker({ redis: this.redis, prefix: 'app' });
    }
  }

  @Cron('*/5 * * * * *')
  async handleCron() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    const userIds = await this.userRepository.findUserIdsToNotify();

    this.elkLogger.log(
      NotifierProducerService.name,
      'notify users',
      userIds,
      LogLevel.LOW,
    );

    for (const userId of userIds) {
      try {
        const unblock = await this.blocker(`notify_${userId}`, 80);
        this.send({ id: userId }, unblock);
      } catch (err) {}
    }
  }

  send(data: { id: string }, unblock: (key: string) => Promise<void>) {
    this.client
      .send('cars_notification', data)
      .subscribe(async ({ userId, sentCarIds }) => {
        this.elkLogger.log(NotifierProducerService.name, 'user notified', {
          userId,
          sentCarIds,
        });
        await unblock(`notify_${userId}`);
      });
  }

  onModuleInit() {
    this.client.subscribeToResponseOf('cars_notification');
  }
}
