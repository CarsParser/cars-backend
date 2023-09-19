import { Injectable } from "@nestjs/common";
import { AvitoRepository } from "./avito/avito.repository";
import { Platform } from "src/user/dto/user.dto";
import { PlatformRepository } from "./platform.repository";

@Injectable()
export class PlatformsFactory {
    constructor(private avitoRepository: AvitoRepository) { }

    create(platform: Platform): PlatformRepository {
        switch (platform) {
            case Platform.avito: {
                return this.avitoRepository;
            }
            default: {
                return this.avitoRepository;
            }
        }
    }
}