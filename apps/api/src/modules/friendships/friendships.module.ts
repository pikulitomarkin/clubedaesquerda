import { Module } from "@nestjs/common";
import { ChatsModule } from "../chats/chats.module";
import { FriendshipsController } from "./friendships.controller";
import { FriendshipsService } from "./friendships.service";

@Module({
  imports: [ChatsModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
