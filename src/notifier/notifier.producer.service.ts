import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UserRepository } from "../user/user.repository";
import { ClientKafka } from "@nestjs/microservices";
import { BlockerService } from "src/helpers/blocker.service";

@Injectable()
export class NotifierProducerService {
  constructor(
    private userRepository: UserRepository,
    @Inject('NOTIFIER_SERVICE') private client: ClientKafka,
    private blockerService: BlockerService,
  ) { }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    const isBlocked = await this.blockerService.block('NotifierProducerService', 60);

    if (isBlocked)
      return;

    const users = await this.userRepository.find({ monitor: true });
    console.log('users', users)

    for (const user of users) {
      this.client.emit('cars_notification', user);
    }

    await this.blockerService.unblock('NotifierProducerService')
  }
}
