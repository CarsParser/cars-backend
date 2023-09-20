import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UserRepository } from "../user/user.repository";
import { ClientKafka } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class NotifierProducerService {
  private readonly logger = new Logger(NotifierProducerService.name);

  constructor(
    private userRepository: UserRepository,
    @Inject('NOTIFIER_SERVICE') private client: ClientKafka,
    private configService: ConfigService
  ) { }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    if (!this.configService.get('HIDDEN')) {
      return;
    }

    const users = await this.userRepository.find({ monitor: true });

    this.logger.log('Notify users', users.map(user => user.id));

    for (const user of users) {
      this.client.emit('cars_notification', user);
    }
  }
}
