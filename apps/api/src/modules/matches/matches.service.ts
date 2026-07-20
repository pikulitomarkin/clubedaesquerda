import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Prisma } from "@clube/database";
import { PrismaService } from "../common/prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { sortPair } from "../common/utils/sort-pair";

// Ver docs/contexto.md §3.2 — par canônico + INSERT ... ON CONFLICT DO
// NOTHING para tornar a criação de Match idempotente sob swipes
// recíprocos concorrentes, sem precisar de lock explícito.
@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async swipe(userId: string, targetId: string, liked: boolean) {
    if (userId === targetId) return { matched: false };

    // Bloqueio é SILENCIOSO: se há bloqueio em qualquer direção, não
    // registra o swipe nem revela ao usuário que existe bloqueio — apenas
    // nunca resulta em match. Sem esta checagem, um bloqueado poderia
    // continuar dando swipe no bloqueador e, com um swipe recíproco
    // residual, recriar o match/chat.
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetId },
          { blockerId: targetId, blockedId: userId },
        ],
      },
    });
    if (blocked) return { matched: false };

    await this.prisma.swipe.upsert({
      where: { userId_targetId: { userId, targetId } },
      update: { liked },
      create: { userId, targetId, liked },
    });

    if (!liked) return { matched: false };

    const reciprocal = await this.prisma.swipe.findUnique({
      where: { userId_targetId: { userId: targetId, targetId: userId } },
    });

    if (!reciprocal || !reciprocal.liked) return { matched: false };

    const [userAId, userBId] = sortPair(userId, targetId);

    const { match, chat, isNew } = await this.prisma.$transaction(async (tx) => {
      // API tipada em vez de INSERT cru: a unicidade do par canônico
      // (userAId, userBId) segue garantida atomicamente pela constraint do
      // Postgres — capturar P2002 é o equivalente exato de ON CONFLICT DO
      // NOTHING, sem acoplar o código ao nome físico das colunas.
      let created: Awaited<ReturnType<typeof tx.match.findUniqueOrThrow>> | null = null;
      try {
        created = await tx.match.create({
          data: { id: randomUUID(), userAId, userBId, status: "ACTIVE" },
        });
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") throw e;
      }

      // Outra requisição concorrente já criou o match (ou ele já existia) —
      // não recriamos o chat nem renotificamos os usuários (ver isNew
      // abaixo). Chat é buscado à parte (não via `include`) para as duas
      // branches devolverem exatamente o mesmo formato de `match`.
      if (!created) {
        const existing = await tx.match.findUniqueOrThrow({
          where: { userAId_userBId: { userAId, userBId } },
        });
        const existingChat = await tx.chat.findUnique({ where: { matchId: existing.id } });
        return { match: existing, chat: existingChat, isNew: false };
      }

      const newChat = await tx.chat.create({
        data: {
          type: "DIRECT",
          matchId: created.id,
          participants: { create: [{ userId: userAId }, { userId: userBId }] },
        },
      });

      return { match: created, chat: newChat, isNew: true };
    });

    if (isNew && chat) {
      const [userA, userB] = await Promise.all([
        this.prisma.profile.findUnique({ where: { userId: userAId }, select: { userId: true, displayName: true, photoUrl: true } }),
        this.prisma.profile.findUnique({ where: { userId: userBId }, select: { userId: true, displayName: true, photoUrl: true } }),
      ]);

      await this.realtime.notifyUsers([userAId, userBId], "match:created", {
        matchId: match.id,
        chatId: chat.id,
        users: [userA, userB].filter(Boolean),
      });
    }

    return { matched: true, matchId: match.id, chatId: chat?.id };
  }

  async unmatch(matchId: string, byUserId: string) {
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: "UNMATCHED", unmatchedAt: new Date(), unmatchedById: byUserId },
    });
  }
}
