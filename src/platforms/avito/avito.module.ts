import { Module } from "@nestjs/common";
import { AvitoRepository } from "./avito.repository";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  providers: [AvitoRepository],
  exports: [AvitoRepository],
})
export class AvitoModule {}
