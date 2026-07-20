import { Module } from "@nestjs/common";
import { BandeirasController } from "./bandeiras.controller";
import { BandeirasService } from "./bandeiras.service";

@Module({
  controllers: [BandeirasController],
  providers: [BandeirasService],
  exports: [BandeirasService],
})
export class BandeirasModule {}
