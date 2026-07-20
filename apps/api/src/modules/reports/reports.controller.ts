import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ReportStatus } from "@clube/database";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { ResolveReportDto } from "./dto/resolve-report.dto";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Botão "DENUNCIAR DE TROLL": qualquer usuário autenticado pode
  // denunciar; limitado para conter spam de denúncias.
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.id, dto);
  }

  // Fila de moderação administrativa — só ADMIN/MODERATOR.
  @Get()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  listQueue(@Query("status") status?: ReportStatus, @Query("cursor") cursor?: string) {
    return this.reportsService.listQueue(status, cursor);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() reviewer: AuthenticatedUser,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(id, reviewer.id, dto);
  }
}
