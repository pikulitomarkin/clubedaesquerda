import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { EventoTipo } from "@clube/database";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { EventsService } from "./events.service";
import { CreateEventoDto } from "./dto/create-evento.dto";
import { InviteDto } from "./dto/invite.dto";
import { RespondConviteDto } from "./dto/respond-convite.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post("eventos")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEventoDto) {
    return this.eventsService.create(user.id, dto);
  }

  // Botão "EVENTOS" / página de Eventos — próximos eventos publicados, de
  // qualquer organizador. `q` é a busca por nome; `tipo` filtra por
  // Evento presencial / Evento online / Clubes / Análises.
  @Get("eventos")
  listUpcoming(@Query("cursor") cursor?: string, @Query("q") q?: string, @Query("tipo") tipo?: string) {
    // `tipo` vem de query string livre — um valor fora do enum quebraria o
    // Prisma com um erro cru (500). Fora do enum = sem filtro de tipo.
    const tipoValido = tipo && tipo in EventoTipo ? (tipo as EventoTipo) : undefined;
    return this.eventsService.listUpcoming(cursor, 30, { q, tipo: tipoValido });
  }

  @Get("eventos/:id")
  findById(@Param("id", ParseUUIDPipe) id: string) {
    return this.eventsService.findById(id);
  }

  // Encerrar/excluir o evento — organizador ou ADMIN/MODERATOR. É o único
  // caminho para remover um evento recorrente (o cleanup automático só
  // toca em eventos únicos encerrados).
  @Delete("eventos/:id")
  async remove(@Param("id", ParseUUIDPipe) eventoId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.eventsService.remove(eventoId, user.id, user.role);
  }

  @Post("eventos/:id/confirmacoes")
  async confirm(@Param("id", ParseUUIDPipe) eventoId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.confirmAttendance(eventoId, user.id);
  }

  @Delete("eventos/:id/confirmacoes")
  async cancel(@Param("id", ParseUUIDPipe) eventoId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.eventsService.cancelAttendance(eventoId, user.id);
  }

  // Botão "convidar".
  @Post("eventos/:id/convites")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  invite(
    @Param("id", ParseUUIDPipe) eventoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteDto,
  ) {
    return this.eventsService.invite(eventoId, user.id, dto);
  }

  // Convites pendentes do usuário logado — alimenta o popup de
  // confirmação/recusa ao carregar o app (além do push em tempo real).
  @Get("convites/pendentes")
  listPendingInvites(@CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.listPendingInvites(user.id);
  }

  // Popup de confirmação/recusa.
  @Post("convites/:id/resposta")
  respondInvite(
    @Param("id", ParseUUIDPipe) conviteId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RespondConviteDto,
  ) {
    return this.eventsService.respondInvite(conviteId, user.id, dto);
  }

  // Eventos exibidos no perfil (organizador, confirmado ou convite
  // aceito) — até 1h após o término, ver EventsService.
  @Get("users/:userId/eventos")
  listForUser(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.eventsService.listForUser(userId);
  }
}
