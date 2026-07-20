import { Module } from "@nestjs/common";
import { InteressesController } from "./interesses.controller";
import { InteressesService } from "./interesses.service";

@Module({
  controllers: [InteressesController],
  providers: [InteressesService],
  exports: [InteressesService],
})
export class InteressesModule {}
