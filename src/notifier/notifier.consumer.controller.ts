import { Controller, Injectable } from "@nestjs/common";
import { EventPattern, Transport } from "@nestjs/microservices";
import { Car } from "src/platforms/platform.repository";
import { PlatformsFactory } from "src/platforms/platforms.factory";
import { UserDTO } from "src/user/dto/user.dto";

@Controller('notifications')
export class NotifierConsumerController {
    constructor(private platformsFactory: PlatformsFactory) { }

    @EventPattern('cars_notification', Transport.KAFKA)
    async handleCarsNotifications(user: UserDTO) {
        console.log('cons: ', user)
        const carsToOffer: Car[] = [];

        // TODO: parallel
        for (const platform of user.platforms) {
            const platformRepository = this.platformsFactory.create(platform);
            const newCars = await platformRepository.find({ config: user.config, lastViewed: new Date() });

            carsToOffer.push(...newCars);
        }

        console.log('cars: ', carsToOffer)
    }
}