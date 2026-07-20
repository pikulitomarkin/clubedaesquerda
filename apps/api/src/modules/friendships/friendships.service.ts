import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { Prisma } from "@clube/database";
import { ChatsService } from "../chats/chats.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { PrismaService } from "../common/prisma/prisma.service";
import { sortPair } from "../common/utils/sort-pair";

// DECISÃO: "ADICIONAR" cria amizade mútua imediata (sem etapa de
// pedido/aceite) — ver docs/contexto.md § "Amizade, bloqueio e chat".
// Reaproveita o mesmo padrão de par canônico de Match (ver contexto.md
// §3.2): canonicalKey = menor(id):maior(id), com
// INSERT ... ON CONFLICT DO NOTHING garantindo idempotência sob cliques
// duplicados/concorrentes sem precisar de lock explícito.
@Injectable()
export class FriendshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatsService: ChatsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private canonicalKey(userA: string, userB: string) {
    return [userA, userB].sort().join(":");
  }

  async isMutualFriend(userAId: string, userBId: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findUnique({
      where: { canonicalKey: this.canonicalKey(userAId, userBId) },
    });
    return friendship?.status === "ACCEPTED";
  }

  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    return !!block;
  }

  async add(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException("Você não pode adicionar a si mesmo");

    if (await this.isBlocked(userId, targetId)) {
      throw new ForbiddenException("Não é possível adicionar este usuário");
    }

    const canonicalKey = this.canonicalKey(userId, targetId);

    // API tipada em vez de INSERT cru: a unicidade de canonicalKey segue
    // garantida atomicamente pela constraint do Postgres — capturar P2002 é
    // o equivalente exato de ON CONFLICT DO NOTHING, sem acoplar o código ao
    // nome físico das colunas.
    let created: { id: string } | null = null;
    try {
      created = await this.prisma.friendship.create({
        data: {
          requesterId: userId,
          addresseeId: targetId,
          canonicalKey,
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
        select: { id: true },
      });
    } catch (e) {
      // Já eram amigos (clique duplo em ADICIONAR): idempotente, não é erro.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") throw e;
    }

    // Idempotente: mesmo quando a amizade já existia, garante que o chat exista.
    const chat = await this.chatsService.getOrCreateDirectChat(userId, targetId);

    if (created) {
      await this.realtime.notifyUsers([userId, targetId], "friendship:created", {
        friendshipId: created.id,
        chatId: chat.id,
        userIds: [userId, targetId],
      });
    }

    return { friendshipId: created?.id, chatId: chat.id };
  }

  // Remove a amizade e torna os perfis mutuamente invisíveis (ver
  // UsersService.findById). Também encerra um Match ativo entre as
  // partes, se existir — bloquear alguém com quem se deu match não deve
  // deixar o chat do match acessível. O usuário bloqueado NÃO é
  // notificado (bloqueio é uma ação silenciosa, por privacidade).
  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException("Você não pode bloquear a si mesmo");

    const canonicalKey = this.canonicalKey(blockerId, blockedId);
    const [userAId, userBId] = sortPair(blockerId, blockedId);

    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        update: {},
        create: { blockerId, blockedId },
      }),
      this.prisma.friendship.deleteMany({ where: { canonicalKey } }),
      this.prisma.match.updateMany({
        where: { userAId, userBId, status: "ACTIVE" },
        data: { status: "UNMATCHED", unmatchedAt: new Date(), unmatchedById: blockerId },
      }),
      // Apaga os swipes recíprocos: sem isto, um swipe residual (liked) do
      // par permitiria recriar o match após o bloqueio (o INSERT ... ON
      // CONFLICT em MatchesService devolveria o match antigo). O swipe em si
      // também é revalidado contra bloqueio em MatchesService.swipe().
      this.prisma.swipe.deleteMany({
        where: {
          OR: [
            { userId: blockerId, targetId: blockedId },
            { userId: blockedId, targetId: blockerId },
          ],
        },
      }),
    ]);

    // Ver docs/contexto.md § "Retenção após bloqueio": o histórico do(s)
    // chat(s) DIRECT entre as partes é retido por 48h (para eventual
    // denúncia/moderação) e então expurgado por job agendado — não é
    // apagado na hora. Acesso ao chat já fica bloqueado imediatamente
    // (ver ChatsService.assertAccess), independente do expurgo.
    await this.chatsService.scheduleChatPurge(blockerId, blockedId);
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });

    // Só cancela o expurgo se NÃO restar bloqueio em nenhuma direção. Sob
    // bloqueio mútuo, desfazer apenas um lado não pode zerar a retenção: o
    // chat seguiria inacessível (o outro bloqueio ainda vale) porém com
    // purgeAt nulo, e portanto nunca seria expurgado — a garantia de 48h
    // falharia em silêncio.
    if (await this.isBlocked(blockerId, blockedId)) return;

    await this.chatsService.cancelChatPurge(blockerId, blockedId);
  }

  async removeFriend(userId: string, targetId: string) {
    const canonicalKey = this.canonicalKey(userId, targetId);
    const result = await this.prisma.friendship.deleteMany({ where: { canonicalKey } });
    if (result.count === 0) throw new ConflictException("Vocês não são amigos");
  }
}
