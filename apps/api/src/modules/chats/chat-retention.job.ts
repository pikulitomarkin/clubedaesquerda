import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../common/prisma/prisma.service";
import { StorageService } from "../common/storage/storage.service";
import { CHAT_PURGE_RETENTION_MS } from "./chats.service";

// Chave arbitrária e fixa do advisory lock do Postgres. Só precisa ser
// única entre os locks da aplicação.
const PURGE_LOCK_KEY = 8_314_207;

// Limite por execução: evita um único DELETE cascateado gigante travando
// tabelas quando muitos chats/rodas vencem ao mesmo tempo. O que sobrar é
// processado na execução seguinte (10 min depois).
const BATCH_SIZE = 100;

const OPEN_REPORT_STATUSES = ["PENDING", "IN_REVIEW"] as const;

// Ver docs/contexto.md § "Retenção após bloqueio" — expurgo automático 48h
// após o bloqueio, e § "Fechamento de roda" — expurgo 48h após arquivar a
// roda. Roda a cada 10 minutos: o prazo é de horas, então 10min mantém o
// atraso desprezível frente à janela de 48h.
@Injectable()
export class ChatRetentionJob {
  private readonly logger = new Logger(ChatRetentionJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES, { name: "chat-retention-purge" })
  async purgeExpired() {
    // @Cron dispara em TODA instância da API. O advisory lock garante que
    // só uma execute o expurgo por vez; as demais saem imediatamente.
    const lockRows = await this.prisma.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_try_advisory_lock(${PURGE_LOCK_KEY}::bigint) AS locked
    `;
    if (!lockRows[0]?.locked) return;

    try {
      await this.purgeExpiredChats();
      await this.purgeArchivedRodas();
    } catch (err) {
      // Sem este catch, uma falha deixaria o expurgo quebrado em silêncio e
      // a retenção deixaria de ser cumprida sem ninguém perceber.
      this.logger.error("Falha no expurgo de retenção", err as Error);
    } finally {
      await this.prisma.$queryRaw`SELECT pg_advisory_unlock(${PURGE_LOCK_KEY}::bigint)`;
    }
  }

  private async purgeExpiredChats() {
    const expired = await this.prisma.chat.findMany({
      where: { purgeAt: { lte: new Date() } },
      take: BATCH_SIZE,
      select: { id: true, participants: { select: { userId: true } } },
    });
    if (expired.length === 0) return;

    const deletableIds = await this.excludeChatsUnderOpenReport(expired);
    if (deletableIds.length === 0) return;

    // Apaga os arquivos ANTES das linhas: se o processo morrer no meio, o
    // pior caso é uma linha apontando para arquivo já removido (degradação
    // visível e corrigível), e não um arquivo órfão invisível para sempre.
    const media = await this.prisma.message.findMany({
      where: { chatId: { in: deletableIds }, mediaUrl: { not: null } },
      select: { mediaUrl: true },
    });
    await this.storage.deleteByUrls(media.map((m) => m.mediaUrl));

    // Cascata do schema: Chat -> {ChatParticipant, Message} -> Reaction.
    const result = await this.prisma.chat.deleteMany({ where: { id: { in: deletableIds } } });

    if (result.count > 0) {
      this.logger.log(`Expurgo de retenção: ${result.count} chat(s) apagado(s).`);
    }
  }

  // Uma denúncia aberta entre os participantes é exatamente o caso de uso
  // que justifica a janela de 48h: apagar o histórico enquanto o caso ainda
  // está na fila destruiria a evidência que a retenção existe para
  // preservar. Esses chats ficam retidos até a denúncia ser resolvida.
  private async excludeChatsUnderOpenReport(
    chats: Array<{ id: string; participants: Array<{ userId: string }> }>,
  ): Promise<string[]> {
    const userIds = [...new Set(chats.flatMap((c) => c.participants.map((p) => p.userId)))];

    const openReports = await this.prisma.report.findMany({
      where: {
        status: { in: [...OPEN_REPORT_STATUSES] },
        reporterId: { in: userIds },
        reportedUserId: { in: userIds },
      },
      select: { reporterId: true, reportedUserId: true },
    });

    if (openReports.length === 0) return chats.map((c) => c.id);

    const pairKey = (a: string, b: string) => [a, b].sort().join(":");
    const protectedPairs = new Set(openReports.map((r) => pairKey(r.reporterId, r.reportedUserId)));

    const kept: string[] = [];
    for (const chat of chats) {
      const ids = chat.participants.map((p) => p.userId);
      const isProtected = ids.some((a, i) => ids.slice(i + 1).some((b) => protectedPairs.has(pairKey(a, b))));
      if (!isProtected) kept.push(chat.id);
    }

    const skipped = chats.length - kept.length;
    if (skipped > 0) {
      this.logger.log(`Expurgo adiado para ${skipped} chat(s) com denúncia aberta.`);
    }
    return kept;
  }

  // Fechar uma roda arquiva (soft) em vez de apagar na hora; o delete
  // definitivo acontece aqui, 48h depois, para dar a mesma janela de
  // moderação do bloqueio. Ver RodasService.close.
  private async purgeArchivedRodas() {
    const cutoff = new Date(Date.now() - CHAT_PURGE_RETENTION_MS);

    const rodas = await this.prisma.roda.findMany({
      where: { archivedAt: { lte: cutoff } },
      take: BATCH_SIZE,
      select: { id: true, imageUrl: true },
    });
    if (rodas.length === 0) return;

    const rodaIds = rodas.map((r) => r.id);

    const [messages, posts] = await Promise.all([
      this.prisma.message.findMany({
        where: { chat: { rodaId: { in: rodaIds } }, mediaUrl: { not: null } },
        select: { mediaUrl: true },
      }),
      this.prisma.post.findMany({
        where: { rodaId: { in: rodaIds } },
        select: { mediaUrls: true },
      }),
    ]);

    await this.storage.deleteByUrls([
      ...rodas.map((r) => r.imageUrl),
      ...messages.map((m) => m.mediaUrl),
      ...posts.flatMap((p) => p.mediaUrls),
    ]);

    // Cascata: Roda -> {Chat -> Message/ChatParticipant, RodaMembro, Mesa, Post}.
    const result = await this.prisma.roda.deleteMany({ where: { id: { in: rodaIds } } });

    if (result.count > 0) {
      this.logger.log(`Expurgo de retenção: ${result.count} roda(s) fechada(s) apagada(s).`);
    }
  }
}
