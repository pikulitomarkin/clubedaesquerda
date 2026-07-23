import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { SugestoesService } from "./sugestoes.service";
import { CreateSugestaoDto } from "./dto/create-sugestao.dto";

@Controller("sugestoes")
@UseGuards(JwtAuthGuard)
export class SugestoesController {
  constructor(private readonly sugestoesService: SugestoesService) {}

  // Botão "SUGIRA PRA NÓS" da home. Exige login (a resposta vai por e-mail)
  // e é limitado para não virar canal de spam.
  @Post()
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSugestaoDto) {
    return this.sugestoesService.create(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  listQueue(@Query("cursor") cursor?: string) {
    return this.sugestoesService.listQueue(cursor);
  }
}
