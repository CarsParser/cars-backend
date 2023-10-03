import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserRepository } from '../user/user.repository';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { BlockerFunction, blocker } from 'src/helpers';
import Redis from 'ioredis';
import { User } from 'src/user/user.entity';

@Injectable()
export class NotifierProducerService {
  private blocker?: BlockerFunction;

  private readonly logger = new Logger(NotifierProducerService.name);

  constructor(
    private userRepository: UserRepository,
    @Inject('NOTIFIER_SERVICE') private client: ClientKafka,
    private configService: ConfigService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {
    if (!this.blocker) {
      this.blocker = blocker({ redis: this.redis, prefix: 'app' });
    }
  }

  @Cron('*/15 * * * * *')
  async handleCron() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    const users = await this.userRepository.find({ monitor: true });

    this.logger.log(
      'Notify users',
      users.map((user) => user.id),
    );

    for (const user of users) {
      try {
        const unblock = await this.blocker(`notify_${user.id}`, 60);
        this.send(user, unblock);
      } catch (err) {}
    }
  }

  send(data: User, unblock: () => Promise<void>) {
    this.client
      .send('cars_notification', data)
      .subscribe(async ({ userId, sentCarIds }) => {
        this.logger.debug(
          `Cars ${sentCarIds.join(', ')} sent to user ${userId}`,
        );
        await unblock();
      });
  }

  onModuleInit() {
    this.client.subscribeToResponseOf('cars_notification');
  }
}
