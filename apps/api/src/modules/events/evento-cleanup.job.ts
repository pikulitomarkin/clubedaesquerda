import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../common/prisma/prisma.service";
import { EVENTO_DEFAULT_DURATION_MS, EVENTO_POST_END_GRACE_MS } from "./events.service";

// Chave arbitrária e fixa do advisory lock do Postgres — só precisa ser
// única entre os locks da aplicação (ver PURGE_LOCK_KEY em
// ChatRetentionJob, que usa outra constante).
const EVENTO_CLEANUP_LOCK_KEY = 8_314_208;

// Limite por execução: evita um DELETE cascateado gigante travando
// tabelas quando muitos eventos vencem ao mesmo tempo (ex.: vários
// eventos "único" com o mesmo horário de término). O que sobrar é
// processado na execução seguinte (10 min depois) — mesmo padrão de
// ChatRetentionJob.
const BATCH_SIZE = 100;

// Exclusão automática de eventos encerrados — ver docs/contexto.md
// § "Eventos únicos vs. recorrentes/permanentes". Só evento com
// recurrenceMode "UNICO" (padrão) vence pelo próprio fim; "RECORRENTE" e
// "PERMANENTE" nunca são tocados aqui — só o organizador (ou
// ADMIN/MODERATOR) os remove, via DELETE /eventos/:id.
//
// O corte usa a MESMA janela de 1h (e a mesma noção de "fim efetivo" para
// eventos sem endsAt) que EventsService.listForUser usa para decidir até
// quando um evento aparece no perfil do convidado — apagar mais cedo
// quebraria essa promessa de exibição.
@Injectable()
export class EventoCleanupJob {
  private readonly logger = new Logger(EventoCleanupJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES, { name: "evento-cleanup" })
  async purgeExpiredUniqueEventos() {
    // @Cron dispara em TODA instância da API. O advisory lock garante que
    // só uma execute o expurgo por vez; as demais saem imediatamente —
    // mesmo padrão de ChatRetentionJob.
    const lockRows = await this.prisma.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_try_advisory_lock(${EVENTO_CLEANUP_LOCK_KEY}::bigint) AS locked
    `;
    if (!lockRows[0]?.locked) return;

    try {
      const cutoff = new Date(Date.now() - EVENTO_POST_END_GRACE_MS);
      // Evento sem `endsAt` só vence depois da duração assumida. Antes, o
      // filtro `startsAt < cutoff` apagava um evento sem término 1h após
      // ele COMEÇAR — destruindo o evento e todas as confirmações enquanto
      // ele ainda acontecia.
      const openEndedCutoff = new Date(cutoff.getTime() - EVENTO_DEFAULT_DURATION_MS);

      const expired = await this.prisma.evento.findMany({
        where: {
          // Só evento "único" (recurrenceMode default) vence pelo próprio
          // fim (efetivo) — recorrente e permanente nunca são tocados
          // aqui, só o organizador os encerra via DELETE /eventos/:id.
          recurrenceMode: "UNICO",
          OR: [{ endsAt: { lt: cutoff } }, { endsAt: null, startsAt: { lt: openEndedCutoff } }],
        },
        take: BATCH_SIZE,
        select: { id: true },
      });

      if (expired.length === 0) return;

      // Cascata do schema: Evento -> {Mesa, Convite, Confirmacao}.
      const result = await this.prisma.evento.deleteMany({
        where: { id: { in: expired.map((e) => e.id) } },
      });

      if (result.count > 0) {
        this.logger.log(`Exclusão automática: ${result.count} evento(s) encerrado(s) apagado(s).`);
      }
    } catch (err) {
      // Sem este catch, uma falha deixaria a exclusão automática quebrada
      // em silêncio — eventos únicos passados se acumulariam sem ninguém
      // perceber.
      this.logger.error("Falha na exclusão automática de eventos", err as Error);
    } finally {
      await this.prisma.$queryRaw`SELECT pg_advisory_unlock(${EVENTO_CLEANUP_LOCK_KEY}::bigint)`;
    }
  }
}
