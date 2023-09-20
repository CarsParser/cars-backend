import { Controller, Logger } from "@nestjs/common";
import { EventPattern, Transport } from "@nestjs/microservices";
import { Car } from "src/platforms/platform.repository";
import { PlatformsFactory } from "src/platforms/platforms.factory";
import { UserDTO } from "src/user/dto/user.dto";

@Controller('notifications')
export class NotifierConsumerController {
    private readonly logger = new Logger(NotifierConsumerController.name);

    constructor(private platformsFactory: PlatformsFactory) { }

    @EventPattern('cars_notification', Transport.KAFKA)
    async handleCarsNotifications(user: UserDTO) {
        const carsToOffer: Car[] = [];

        this.logger.debug('Notify user', user);

        for (const platform of user.platforms) {
            try {
                const platformRepository = this.platformsFactory.create(platform);
                const newCars = await platformRepository.find({ config: user.config, lastViewed: new Date() });

                this.logger.debug(`Found cars for user ${user.id}`, newCars);

                carsToOffer.push(...newCars);
            } catch (err) {
                this.logger.error(`Unable to find cars for user ${user.id} plaform ${platform}`, err);
            }
        }
    }
}