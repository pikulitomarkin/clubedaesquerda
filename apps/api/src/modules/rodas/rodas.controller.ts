import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { RodasService } from "./rodas.service";
import { CreateRodaDto } from "./dto/create-roda.dto";

// @Controller() vazio (paths totalmente qualificados por método) — mesmo
// padrão de EventsController/HomenagensController, necessário para
// expor "users/:userId/rodas" ao lado das rotas "rodas/...".
@Controller()
export class RodasController {
  constructor(private readonly rodasService: RodasService) {}

  // Pública com auth opcional: identifica o viewer, quando houver, para
  // ocultar membros bloqueados da lista.
  @Get("rodas/:slug")
  @UseGuards(OptionalJwtAuthGuard)
  findBySlug(@Param("slug") slug: string, @CurrentUser() viewer?: AuthenticatedUser) {
    return this.rodasService.findBySlug(slug, viewer?.id);
  }

  @Post("rodas")
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRodaDto) {
    return this.rodasService.create(user.id, dto);
  }

  // Botão "ENTRAR NA RODA".
  @Post("rodas/:id/membros")
  @UseGuards(JwtAuthGuard)
  join(@Param("id") rodaId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rodasService.join(rodaId, user.id);
  }

  // Botão "SAIR".
  @Delete("rodas/:id/membros/me")
  @UseGuards(JwtAuthGuard)
  leave(@Param("id") rodaId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rodasService.leave(rodaId, user.id);
  }

  // Botão "FECHAR RODA" — dono da roda ou ADMIN/MODERATOR da plataforma.
  @Delete("rodas/:id")
  @UseGuards(JwtAuthGuard)
  close(@Param("id") rodaId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rodasService.close(rodaId, user.id, user.role);
  }

  // Rodas exibidas no perfil (com imagem) — ver docs/contexto.md §
  // "Entrada na Roda".
  @Get("users/:userId/rodas")
  @UseGuards(JwtAuthGuard)
  listForUser(@Param("userId") userId: string) {
    return this.rodasService.listForUser(userId);
  }
}
