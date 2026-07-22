import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { existsSync } from "node:fs";
import { basename, resolve, sep } from "node:path";
import { ReportStatus } from "@clube/database";
import { PrismaService } from "../common/prisma/prisma.service";
import { EVIDENCE_UPLOAD_DIR } from "../common/uploads/upload.constants";
import { CreateReportDto } from "./dto/create-report.dto";
import { ResolveReportDto } from "./dto/resolve-report.dto";

// Estados "abertos" da fila: uma denúncia nesses estados ainda aguarda ou
// está em análise. Usados tanto na listagem quanto na dedup de criação e na
// guarda de transição do resolve().
const OPEN_STATUSES: ReportStatus[] = ["PENDING", "IN_REVIEW"];

// Fila de moderação administrativa: toda denúncia nasce PENDING e só
// ADMIN/MODERATOR pode transicioná-la (ver RolesGuard nos controllers).
// Categorias são um enum fixo (ReportCategory) — não texto livre — para
// permitir triagem e métricas consistentes.
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateReportDto) {
    if (reporterId === dto.reportedUserId) {
      throw new BadRequestException("Você não pode denunciar a si mesmo");
    }

    // Alvo precisa existir e não estar excluído — evita erro de FK (P2003 →
    // 500) por UUID válido porém inexistente e denúncia contra conta já
    // apagada.
    const target = await this.prisma.user.findFirst({
      where: { id: dto.reportedUserId, deletedAt: null },
      select: { id: true },
    });
    if (!target) throw new NotFoundException("Usuário não encontrado");

    // Dedup: se o mesmo denunciante já tem uma denúncia aberta contra o mesmo
    // alvo, devolve a existente em vez de criar outra. Impede que um único
    // usuário (ou brigading coordenado, um por conta) infle a fila com
    // denúncias repetidas contra o mesmo alvo. Novas evidências de um caso já
    // aberto devem ir para a denúncia existente, não gerar uma nova linha.
    const existing = await this.prisma.report.findFirst({
      where: {
        reporterId,
        reportedUserId: dto.reportedUserId,
        status: { in: OPEN_STATUSES },
      },
    });
    if (existing) return existing;

    return this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId: dto.reportedUserId,
        category: dto.category,
        description: dto.description,
        // A coluna se chama evidenceUrls por herança do schema, mas passa a
        // guardar REFERÊNCIAS opacas (UUID.ext), não URLs — o anexo é privado
        // e só sai pela rota autenticada getEvidenceFile.
        evidenceUrls: dto.evidenceRefs ?? [],
      },
    });
  }

  // Resolve o caminho físico de um anexo de denúncia para streaming, e
  // registra o acesso em AuditLog (LGPD art. 37 — quem viu qual evidência,
  // quando). Só é chamado pela rota restrita a ADMIN/MODERATOR.
  async getEvidenceFile(reportId: string, index: number, actorId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, evidenceUrls: true },
    });
    if (!report) throw new NotFoundException("Denúncia não encontrada");

    const ref = report.evidenceUrls[index];
    // basename() descarta qualquer componente de diretório; combinado com o
    // startsWith abaixo, impede path traversal mesmo que uma ref corrompida
    // tenha escapado da validação do DTO.
    const name = ref ? basename(ref) : "";
    const full = resolve(EVIDENCE_UPLOAD_DIR, name);
    if (!name || !full.startsWith(EVIDENCE_UPLOAD_DIR + sep) || !existsSync(full)) {
      throw new NotFoundException("Evidência não encontrada");
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "report.evidence.view",
        targetType: "Report",
        targetId: reportId,
        metadata: { index, ref: name },
      },
    });

    return { path: full, filename: name };
  }

  listQueue(status?: ReportStatus, cursor?: string, take = 20) {
    return this.prisma.report.findMany({
      where: status ? { status } : { status: { in: OPEN_STATUSES } },
      // Ordenação composta (createdAt, id): sem o id como desempate, denúncias
      // com o mesmo createdAt podiam ser puladas/repetidas entre páginas,
      // já que o cursor é por id. FIFO da fila (mais antiga primeiro).
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        reporter: { select: { id: true, profile: { select: { displayName: true } } } },
        reportedUser: { select: { id: true, profile: { select: { displayName: true } } } },
      },
    });
  }

  async resolve(id: string, reviewerId: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException("Denúncia não encontrada");

    // Conflito de interesse: quem é parte da denúncia (alvo ou autor) não
    // pode revisá-la — sem isto, um MODERATOR denunciado poderia dispensar a
    // denúncia contra si próprio.
    if (report.reportedUserId === reviewerId || report.reporterId === reviewerId) {
      throw new ForbiddenException("Você não pode revisar uma denúncia da qual é parte");
    }

    return this.prisma.$transaction(async (tx) => {
      // Transição condicional e atômica: só avança a partir de um estado
      // aberto. Se count === 0, ou a denúncia já foi resolvida por outro
      // moderador (corrida), ou está em estado final — em ambos os casos não
      // sobrescrevemos a decisão/autoria já registrada.
      const res = await tx.report.updateMany({
        where: { id, status: { in: OPEN_STATUSES } },
        data: {
          status: dto.status,
          resolutionNote: dto.resolutionNote,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });

      if (res.count === 0) {
        throw new ConflictException("Esta denúncia já foi resolvida por outro moderador");
      }

      // Trilha de auditoria imutável (LGPD art. 37/46): o campo reviewedById
      // na própria linha é sobrescrevível numa reabertura; o AuditLog não.
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: `report.${dto.status.toLowerCase()}`,
          targetType: "Report",
          targetId: id,
          metadata: {
            previousStatus: report.status,
            newStatus: dto.status,
            reportedUserId: report.reportedUserId,
            resolutionNote: dto.resolutionNote ?? null,
          },
        },
      });

      return tx.report.findUniqueOrThrow({ where: { id } });
    });
  }
}
