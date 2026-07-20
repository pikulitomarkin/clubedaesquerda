import { Module } from "@nestjs/common";
import { ChatsController } from "./chats.controller";
import { ChatsService } from "./chats.service";
import { ChatRetentionJob } from "./chat-retention.job";

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, ChatRetentionJob],
  exports: [ChatsService],
})
export class ChatsModule {}
