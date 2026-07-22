import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { ReportStatus } from "@clube/database";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { EVIDENCE_UPLOAD_DIR, uploadInterceptorOptions } from "../common/uploads/upload.constants";
import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { ResolveReportDto } from "./dto/resolve-report.dto";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Upload de anexo de denúncia. Vai para o diretório PRIVADO (evidence/),
  // que não é servido estaticamente — devolve só uma referência opaca, que o
  // cliente inclui em `evidenceRefs` ao criar a denúncia. Ver contexto.md.
  @Post("evidence")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("file", uploadInterceptorOptions(EVIDENCE_UPLOAD_DIR)))
  uploadEvidence(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("Nenhum arquivo enviado");
    return { ref: file.filename };
  }

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

  // Leitura de um anexo de denúncia — só ADMIN/MODERATOR, e cada acesso é
  // gravado em AuditLog (ver ReportsService.getEvidenceFile). É o ÚNICO
  // caminho para ler uma evidência; o arquivo nunca é servido estaticamente.
  @Get(":id/evidence/:index")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async getEvidence(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("index", ParseIntPipe) index: number,
    @CurrentUser() reviewer: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { path, filename } = await this.reportsService.getEvidenceFile(id, index, reviewer.id);
    // attachment: o painel de moderação baixa o anexo, nunca o renderiza
    // inline na origem da API.
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.sendFile(path);
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
