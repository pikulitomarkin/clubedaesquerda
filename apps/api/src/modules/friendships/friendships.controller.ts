import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { FriendshipsService } from "./friendships.service";
import { BlockUserDto, RequestFriendshipDto, RespondFriendshipDto } from "./dto/friendship.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  // Botão "ADICIONAR": abre um pedido de amizade (ou aceita, se o alvo já
  // tinha pedido). Ver FriendshipsService.add.
  @Post("friendships")
  async add(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestFriendshipDto) {
    return this.friendshipsService.add(user.id, dto.addresseeId);
  }

  // Pedidos de amizade recebidos e pendentes — seção "Solicitações de
  // amizade" no próprio perfil.
  @Get("friendships/pendentes")
  listPendingRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.friendshipsService.listPendingRequests(user.id);
  }

  // Botão "Aceitar"/"Recusar" de uma solicitação.
  @Post("friendships/:id/resposta")
  respond(
    @Param("id", ParseUUIDPipe) friendshipId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RespondFriendshipDto,
  ) {
    return this.friendshipsService.respond(user.id, friendshipId, dto.accept);
  }

  // Lista de amigos exibida no perfil (própria ou de terceiros).
  @Get("users/:userId/amigos")
  listFriends(@Param("userId", ParseUUIDPipe) userId: string, @CurrentUser() viewer: AuthenticatedUser) {
    return this.friendshipsService.listFriends(userId, viewer.id);
  }

  @Delete("friendships/:userId")
  async removeFriend(@CurrentUser() user: AuthenticatedUser, @Param("userId", ParseUUIDPipe) userId: string) {
    await this.friendshipsService.removeFriend(user.id, userId);
  }

  // Botão "BLOQUEAR": remove amizade e torna os perfis mutuamente
  // invisíveis (ver UsersService.findById).
  @Post("blocks")
  async block(@CurrentUser() user: AuthenticatedUser, @Body() dto: BlockUserDto) {
    await this.friendshipsService.block(user.id, dto.userId);
  }

  @Delete("blocks/:userId")
  async unblock(@CurrentUser() user: AuthenticatedUser, @Param("userId", ParseUUIDPipe) userId: string) {
    await this.friendshipsService.unblock(user.id, userId);
  }
}
