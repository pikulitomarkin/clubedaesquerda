import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../common/prisma/prisma.service";
import { BlocksService } from "../common/blocks/blocks.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { CreateEventoDto } from "./dto/create-evento.dto";
import { InviteDto } from "./dto/invite.dto";
import { RespondConviteDto } from "./dto/respond-convite.dto";

// Janela de 1h compartilhada por DUAS regras que precisam bater exatamente
// (ver docs/contexto.md § "Eventos únicos vs. recorrentes/permanentes"):
//   1. um evento "único" continua visível no perfil do convidado até 1h
//      após o término (EventsService.listForUser);
//   2. o EventoCleanupJob só apaga um evento único depois dessa mesma 1h.
// Se essas janelas divergissem, a exclusão automática apagaria o evento
// antes do prazo de exibição prometido no perfil.
export const EVENTO_POST_END_GRACE_MS = 60 * 60_000;

// Duração assumida para evento SEM `endsAt`. Antes, tanto o cleanup quanto
// listForUser tratavam um evento sem término como se acabasse em `startsAt`
// — ou seja, um ato que durasse a tarde inteira era apagado (com todas as
// confirmações) 1h depois de COMEÇAR, ainda acontecendo. O "fim efetivo"
// abaixo é a fonte única dessa regra; job, listagem e confirmação usam a
// mesma noção para não divergirem.
export const EVENTO_DEFAULT_DURATION_MS = 24 * 60 * 60_000;

export function eventoEffectiveEnd(evento: { startsAt: Date; endsAt: Date | null }): Date {
  return evento.endsAt ?? new Date(evento.startsAt.getTime() + EVENTO_DEFAULT_DURATION_MS);
}

// Status que efetivamente OCUPAM uma vaga do evento. CHECKED_IN precisa
// estar aqui: quem fez check-in está presente e ocupa vaga tanto quanto
// quem só confirmou. Fora desta lista, cancelar um CHECKED_IN não
// devolveria a vaga (confirmedCount subiria para sempre) e o check-in
// sumiria da lista de confirmados.
const OCCUPYING_STATUSES = ["CONFIRMED", "CHECKED_IN"] as const;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(organizerId: string, dto: CreateEventoDto) {
    return this.prisma.evento.create({
      data: {
        title: dto.title,
        description: dto.description,
        tipo: dto.tipo,
        status: "PUBLISHED",
        address: dto.address,
        city: dto.city,
        state: dto.state?.toUpperCase(),
        onlineUrl: dto.onlineUrl,
        rodaId: dto.rodaId,
        bandeiraId: dto.bandeiraId,
        organizerId,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        capacity: dto.capacity,
        recurrenceFrequency: dto.recurrenceFrequency,
        recurrenceUntil: dto.recurrenceUntil ? new Date(dto.recurrenceUntil) : undefined,
      },
    });
  }

  async findById(eventoId: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      include: {
        organizer: { select: { id: true, profile: { select: { displayName: true, photoUrl: true } } } },
        // "CONFIRMADÍSSIM@S": lista de quem confirmou presença, mais
        // antiga primeiro (ordem de chegada). Inclui CHECKED_IN — filtrar
        // só CONFIRMED fazia quem chegava ao evento e fazia check-in
        // desaparecer da lista de presentes.
        confirmacoes: {
          where: { status: { in: [...OCCUPYING_STATUSES] } },
          orderBy: { confirmedAt: "asc" },
          include: {
            user: { select: { id: true, profile: { select: { displayName: true, photoUrl: true } } } },
          },
        },
      },
    });
    if (!evento) throw new NotFoundException("Evento não encontrado");
    return evento;
  }

  // Eventos exibidos no perfil de um usuário: onde é organizador, está
  // confirmado, ou aceitou um convite — até 1h após o término (ver
  // EVENTO_POST_END_GRACE_MS acima).
  async listForUser(userId: string) {
    const cutoff = new Date(Date.now() - EVENTO_POST_END_GRACE_MS);
    // Evento sem `endsAt` só sai da lista depois da duração assumida (ver
    // EVENTO_DEFAULT_DURATION_MS) — antes sumia 1h após COMEÇAR.
    const openEndedCutoff = new Date(cutoff.getTime() - EVENTO_DEFAULT_DURATION_MS);

    return this.prisma.evento.findMany({
      where: {
        AND: [
          {
            OR: [
              { organizerId: userId },
              { confirmacoes: { some: { userId, status: { in: [...OCCUPYING_STATUSES] } } } },
              { convites: { some: { inviteeId: userId, status: "ACCEPTED" } } },
            ],
          },
          {
            OR: [
              { endsAt: { gte: cutoff } },
              { endsAt: null, startsAt: { gte: openEndedCutoff } },
            ],
          },
        ],
      },
      orderBy: { startsAt: "asc" },
    });
  }

  // Encerramento manual do evento — organizador ou ADMIN/MODERATOR.
  //
  // Sem este caminho, um evento RECORRENTE não tinha como ser removido por
  // ninguém: o EventoCleanupJob ignora recorrentes de propósito, e a
  // documentação dizia "é o organizador quem decide encerrá-los" sem que
  // existisse endpoint para isso. Recorrentes se acumulariam para sempre.
  async remove(eventoId: string, userId: string, actorRole: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      select: {
        organizerId: true,
        confirmacoes: {
          where: { status: { in: [...OCCUPYING_STATUSES] } },
          select: { userId: true },
        },
      },
    });
    if (!evento) throw new NotFoundException("Evento não encontrado");

    const isOrganizer = evento.organizerId === userId;
    const isPlatformStaff = actorRole === "ADMIN" || actorRole === "MODERATOR";
    if (!isOrganizer && !isPlatformStaff) {
      throw new ForbiddenException("Só quem organiza o evento pode encerrá-lo");
    }

    // deleteMany (não delete): dois cliques simultâneos fazem o segundo
    // encontrar count 0 e virar 404, em vez de P2025 não tratado (500).
    const deleted = await this.prisma.evento.deleteMany({ where: { id: eventoId } });
    if (deleted.count === 0) throw new NotFoundException("Evento não encontrado");

    const interested = new Set([evento.organizerId, ...evento.confirmacoes.map((c) => c.userId)]);
    await this.realtime.notifyUsers([...interested], "evento:encerrado", { eventoId });
  }

  // Ver docs/contexto.md §3.4 — UPDATE condicional atômico em
  // eventos.confirmed_count evita overselling de vagas sem lock explícito
  // de linha; fallback para lista de espera quando a capacidade se esgota.
  async confirmAttendance(eventoId: string, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Carregado ANTES da reserva por dois motivos:
      //   1. o UPDATE condicional abaixo devolve 0 linhas tanto para "sem
      //      vaga" quanto para "evento não existe" — sem esta consulta, o
      //      código tratava as duas como lotação e o INSERT seguinte
      //      estourava violação de FK (500 em vez de 404);
      //   2. permite recusar confirmação em evento já encerrado, o que
      //      fecha a corrida com o EventoCleanupJob pela raiz: se não se
      //      confirma evento encerrado e o job só apaga evento encerrado,
      //      os dois conjuntos deixam de se sobrepor.
      const evento = await tx.evento.findUnique({
        where: { id: eventoId },
        select: { startsAt: true, endsAt: true },
      });
      if (!evento) throw new NotFoundException("Evento não encontrado");

      if (eventoEffectiveEnd(evento).getTime() < Date.now()) {
        throw new ConflictException("Este evento já foi encerrado");
      }

      // SQL cru é necessário aqui: o Prisma não expressa comparação entre
      // duas COLUNAS (confirmedCount < capacity) no `where`, e é justamente
      // isso que torna a reserva de vaga atômica contra overselling.
      //
      // Identificadores: o schema usa @@map nas TABELAS (eventos) mas não
      // tem @map nos campos, então as colunas nascem com o nome do campo em
      // camelCase e precisam de aspas duplas no Postgres.
      const reserved = await tx.$queryRaw<Array<{ confirmedCount: number }>>`
        UPDATE eventos
        SET "confirmedCount" = "confirmedCount" + 1
        WHERE id = ${eventoId}
          AND (capacity IS NULL OR "confirmedCount" < capacity)
        RETURNING "confirmedCount"
      `;

      const status = reserved.length > 0 ? "CONFIRMED" : "WAITLISTED";

      // DO UPDATE ... WHERE status = 'CANCELLED' revive quem havia
      // cancelado. Com o DO NOTHING anterior, a linha CANCELLED remanescente
      // fazia o INSERT conflitar e a pessoa recebia "Presença já confirmada"
      // — mensagem errada (ela cancelou) e bloqueio permanente para voltar.
      // Quando o status atual NÃO é CANCELLED, o WHERE falha, nada é
      // retornado e caímos no conflito legítimo de double-submit.
      // SQL cru também necessário aqui: o `upsert` do Prisma não expressa a
      // condição do DO UPDATE (só atualiza se o status atual for CANCELLED).
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO confirmacoes (id, "eventoId", "userId", status, "confirmedAt")
        VALUES (${randomUUID()}, ${eventoId}, ${userId}, ${status}::"ConfirmacaoStatus", now())
        ON CONFLICT ("eventoId", "userId") DO UPDATE
          SET status = EXCLUDED.status,
              "confirmedAt" = now(),
              "cancelledAt" = NULL
          WHERE confirmacoes.status = 'CANCELLED'
        RETURNING id
      `;

      if (rows.length === 0) {
        // Já havia confirmação ativa: desfaz o incremento reservado acima
        // antes de encerrar a transação com erro.
        if (reserved.length > 0) {
          await tx.evento.update({ where: { id: eventoId }, data: { confirmedCount: { decrement: 1 } } });
        }
        throw new ConflictException("Presença já confirmada para este evento");
      }

      return { status, confirmacaoId: rows[0]!.id };
    });

    if (result.status === "CONFIRMED") {
      await this.notifyConfirmacoesAtualizadas(eventoId);
    }

    return result;
  }

  async cancelAttendance(eventoId: string, userId: string) {
    const { freedSlot, promotedUserId } = await this.prisma.$transaction(async (tx) => {
      const confirmacao = await tx.confirmacao.findUnique({ where: { eventoId_userId: { eventoId, userId } } });
      if (!confirmacao || confirmacao.status === "CANCELLED") {
        return { freedSlot: false, promotedUserId: null as string | null };
      }

      await tx.confirmacao.update({
        where: { id: confirmacao.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      // Cancelar quem estava só na fila (WAITLISTED) não libera vaga
      // nenhuma — ele não ocupava vaga — e portanto não promove ninguém.
      if (!OCCUPYING_STATUSES.includes(confirmacao.status as (typeof OCCUPYING_STATUSES)[number])) {
        return { freedSlot: false, promotedUserId: null as string | null };
      }

      await tx.evento.update({ where: { id: eventoId }, data: { confirmedCount: { decrement: 1 } } });

      // Promoção do primeiro da fila, na MESMA transação do cancelamento.
      // A documentação previa um job assíncrono para isso, mas ele nunca
      // existiu: WAITLISTED era escrito e jamais lido, então quem entrava
      // na fila ficava lá para sempre mesmo com vaga aberta. Fazer aqui é
      // atômico (sem janela em que a vaga fica órfã) e imediato.
      const next = await tx.confirmacao.findFirst({
        where: { eventoId, status: "WAITLISTED" },
        orderBy: { confirmedAt: "asc" }, // FIFO por ordem de chegada
        select: { id: true, userId: true },
      });
      if (!next) return { freedSlot: true, promotedUserId: null as string | null };

      // Condicional: dois cancelamentos concorrentes podem ler o MESMO
      // primeiro da fila. Só quem efetivamente muda a linha (count === 1)
      // incrementa o contador — sem isso, a mesma pessoa seria promovida
      // duas vezes e confirmedCount subiria em dobro.
      const promoted = await tx.confirmacao.updateMany({
        where: { id: next.id, status: "WAITLISTED" },
        data: { status: "CONFIRMED" }, // confirmedAt preservado: é a ordem de chegada
      });
      if (promoted.count === 0) return { freedSlot: true, promotedUserId: null as string | null };

      await tx.evento.update({ where: { id: eventoId }, data: { confirmedCount: { increment: 1 } } });

      return { freedSlot: true, promotedUserId: next.userId };
    });

    if (freedSlot) await this.notifyConfirmacoesAtualizadas(eventoId);

    if (promotedUserId) {
      await this.realtime.notifyUsers([promotedUserId], "evento:vaga_confirmada", { eventoId });
    }
  }

  // Botão "convidar": só quem já está envolvido no evento (organizador
  // ou já confirmado) pode convidar mais gente — sem isso, qualquer
  // desconhecido logado convidaria pessoas para um evento com o qual não
  // tem nenhuma relação. Ver docs/contexto.md § "Sistema de convites".
  private async assertCanInvite(eventoId: string, userId: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id: eventoId }, select: { organizerId: true } });
    if (!evento) throw new NotFoundException("Evento não encontrado");
    if (evento.organizerId === userId) return;

    const confirmacao = await this.prisma.confirmacao.findUnique({
      where: { eventoId_userId: { eventoId, userId } },
    });
    if (confirmacao?.status !== "CONFIRMED") {
      throw new ForbiddenException("Só quem já confirmou presença pode convidar outras pessoas");
    }
  }

  // Múltiplos convites para a mesma pessoa são permitidos de propósito —
  // ver comentário no schema (model Convite). Cada chamada cria uma nova
  // linha, mesmo que já exista um PENDING para o mesmo par.
  async invite(eventoId: string, inviterId: string, dto: InviteDto) {
    if (inviterId === dto.inviteeId) throw new BadRequestException("Você não pode convidar a si mesmo");

    await this.assertCanInvite(eventoId, inviterId);

    if (await this.blocks.isBlocked(inviterId, dto.inviteeId)) {
      throw new ForbiddenException("Não é possível convidar este usuário");
    }

    const evento = await this.prisma.evento.findUniqueOrThrow({
      where: { id: eventoId },
      select: { title: true },
    });

    const convite = await this.prisma.convite.create({
      data: { eventoId, inviterId, inviteeId: dto.inviteeId },
    });

    // Dispara o popup de confirmação/recusa no client do convidado (ver
    // docs/contexto.md § "Sistema de convites").
    await this.realtime.notifyUsers([dto.inviteeId], "convite:recebido", {
      conviteId: convite.id,
      eventoId,
      eventoTitle: evento.title,
      inviterId,
    });

    return convite;
  }

  async listPendingInvites(userId: string) {
    return this.prisma.convite.findMany({
      where: { inviteeId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        evento: { select: { id: true, title: true, startsAt: true, tipo: true } },
        inviter: { select: { id: true, profile: { select: { displayName: true } } } },
      },
    });
  }

  // Aceitar reaproveita a mesma transação atômica de confirmAttendance
  // (capacidade/waitlist) — um convite aceito consome vaga como qualquer
  // outra confirmação. Como o mesmo par (evento, convidado) pode ter
  // vários convites PENDING (múltiplos convites permitidos, ver schema),
  // aceitar UM resolve todos os outros: não faz sentido continuar
  // perguntando algo que a pessoa já confirmou por outra via.
  async respondInvite(conviteId: string, userId: string, dto: RespondConviteDto) {
    const convite = await this.prisma.convite.findUnique({ where: { id: conviteId } });
    if (!convite || convite.inviteeId !== userId) throw new NotFoundException("Convite não encontrado");
    if (convite.status !== "PENDING") return convite;

    if (!dto.accept) {
      return this.prisma.convite.update({
        where: { id: conviteId },
        data: { status: "DECLINED", respondedAt: new Date() },
      });
    }

    try {
      await this.confirmAttendance(convite.eventoId, userId);
    } catch (err) {
      if (!(err instanceof ConflictException)) throw err;

      // ConflictException aqui tem dois significados possíveis: "já
      // confirmado por outra via" (idempotente, tudo bem) ou "evento já
      // encerrado" (erro real, precisa chegar ao cliente). Distinguimos
      // pelo estado efetivo, não pela mensagem.
      const confirmacao = await this.prisma.confirmacao.findUnique({
        where: { eventoId_userId: { eventoId: convite.eventoId, userId } },
      });
      if (!confirmacao || confirmacao.status === "CANCELLED") throw err;
    }

    await this.prisma.convite.updateMany({
      where: { eventoId: convite.eventoId, inviteeId: userId, status: "PENDING" },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });

    return this.prisma.convite.findUniqueOrThrow({ where: { id: conviteId } });
  }

  // Notifica quem provavelmente está de olho na lista de confirmados
  // (organizador + já confirmados) para a UI atualizar
  // "CONFIRMADÍSSIM@S" em tempo real. Ver docs/contexto.md.
  private async notifyConfirmacoesAtualizadas(eventoId: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
      select: {
        organizerId: true,
        confirmacoes: { where: { status: "CONFIRMED" }, select: { userId: true } },
      },
    });
    if (!evento) return;

    const interested = new Set([evento.organizerId, ...evento.confirmacoes.map((c) => c.userId)]);
    await this.realtime.notifyUsers([...interested], "evento:confirmacoes_atualizadas", { eventoId });
  }
}
