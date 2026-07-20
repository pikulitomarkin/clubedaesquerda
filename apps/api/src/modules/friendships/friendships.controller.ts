import { Body, Controller, Delete, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { FriendshipsService } from "./friendships.service";
import { BlockUserDto, RequestFriendshipDto } from "./dto/friendship.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  // Botão "ADICIONAR": cria amizade mútua imediata + acesso ao chat.
  @Post("friendships")
  async add(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestFriendshipDto) {
    return this.friendshipsService.add(user.id, dto.addresseeId);
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
