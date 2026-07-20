import { Module } from "@nestjs/common";
import { FriendshipsModule } from "../friendships/friendships.module";
import { HomenagensController } from "./homenagens.controller";
import { HomenagensService } from "./homenagens.service";

@Module({
  imports: [FriendshipsModule],
  controllers: [HomenagensController],
  providers: [HomenagensService],
})
export class HomenagensModule {}
