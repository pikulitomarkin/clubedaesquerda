import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { ChatsService } from "./chats.service";
import { SendMessageDto } from "./dto/send-message.dto";

@Controller("chats")
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async listMyChats(@CurrentUser() user: AuthenticatedUser) {
    return this.chatsService.listMyChats(user.id);
  }

  @Get(":id/messages")
  async listMessages(
    @Param("id", ParseUUIDPipe) chatId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query("cursor") cursor?: string,
  ) {
    return this.chatsService.listMessages(chatId, user.id, cursor);
  }

  // Envio via REST não empurra o evento em tempo real para o outro
  // participante (isso é feito pelo evento WS "send_message", ver
  // RealtimeGateway) — existe como fallback para clientes sem conexão
  // WebSocket ativa; a mensagem aparece para o outro lado no próximo
  // GET :id/messages.
  @Post("messages")
  async sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    const { message } = await this.chatsService.sendMessage(user.id, dto);
    return message;
  }
}
