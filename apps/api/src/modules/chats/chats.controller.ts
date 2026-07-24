import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { ChatsService } from "./chats.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { CreateGroupChatDto } from "./dto/create-group-chat.dto";

@Controller("chats")
@UseGuards(JwtAuthGuard)
export class ChatsController {
  // RealtimeGateway injetado aqui (não no ChatsService) de propósito: o
  // RealtimeModule já importa ChatsModule para obter ChatsService (usado
  // pelo handler WS de send_message) — se ChatsService também dependesse
  // de RealtimeGateway, seria um ciclo de módulos. Injetar no controller
  // evita isso (RealtimeModule é @Global, não precisa ser importado aqui).
  constructor(
    private readonly chatsService: ChatsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Get()
  async listMyChats(@CurrentUser() user: AuthenticatedUser) {
    return this.chatsService.listMyChats(user.id);
  }

  // Botão "CONVERSAR" do perfil — qualquer pessoa pode iniciar (ao
  // contrário de ADICIONAR, não exige amizade). Idempotente: reabrir o
  // mesmo chat existente em vez de duplicar.
  @Post(":userId/iniciar")
  async startDirectChat(
    @Param("userId", ParseUUIDPipe) targetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chatsService.startDirectChat(user.id, targetId);
  }

  // Botão "RODA DE CONVERSA" acima da lista — cria um grupo avulso.
  // Notifica os participantes selecionados para a nova aba aparecer na
  // lista deles sem precisar recarregar (mesmo padrão de
  // "friendship:created").
  @Post("grupo")
  async createGroupChat(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupChatDto) {
    const chat = await this.chatsService.createGroupChat(user.id, dto);
    const participantIds = chat.participants.map((p) => p.userId);
    await this.realtime.notifyUsers(participantIds, "chat:grupo_criado", {
      chatId: chat.id,
      name: chat.name,
      imageUrl: chat.imageUrl,
    });
    return chat;
  }

  // Botão "SAIR" da roda de conversa avulsa — qualquer membro, exceto o
  // criador.
  @Post(":id/sair")
  @HttpCode(204)
  async leaveGroupChat(@Param("id", ParseUUIDPipe) chatId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.chatsService.leaveGroupChat(user.id, chatId);
  }

  // Botão "FECHAR RODA" — só o criador. O chat desaparece para todos na
  // hora (ver ChatsService.closeGroupChat) — notifica os participantes
  // para fechar a aba, reaproveitando o mesmo evento/formato que
  // RodasService.close usa para o fechamento de Roda de comunidade
  // (ChatWindow já escuta "roda:closed" e fecha a própria aba ao bater o
  // chatId, sem precisar de nenhuma mudança no client).
  @Delete(":id")
  @HttpCode(204)
  async closeGroupChat(@Param("id", ParseUUIDPipe) chatId: string, @CurrentUser() user: AuthenticatedUser) {
    const { participantIds } = await this.chatsService.closeGroupChat(user.id, chatId);
    await this.realtime.notifyUsers(participantIds, "roda:closed", { rodaId: null, chatId });
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
