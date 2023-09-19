import { Module } from "@nestjs/common";
import { AvitoModule } from "./avito/avito.module";
import { PlatformsFactory } from "./platforms.factory";

@Module({
    imports: [AvitoModule],
    providers: [PlatformsFactory],
    exports: [PlatformsFactory]
})
export class PlatformsModule { }