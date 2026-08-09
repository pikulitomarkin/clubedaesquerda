import { Module } from "@nestjs/common";
import { EmailModule } from "../email/email.module";
import { SugestoesController } from "./sugestoes.controller";
import { SugestoesService } from "./sugestoes.service";

@Module({
  imports: [EmailModule],
  controllers: [SugestoesController],
  providers: [SugestoesService],
})
export class SugestoesModule {}
