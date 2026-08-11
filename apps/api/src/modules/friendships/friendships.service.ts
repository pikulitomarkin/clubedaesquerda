import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ChatsService } from "../chats/chats.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { BlocksService } from "../common/blocks/blocks.service";
import { PrismaService } from "../common/prisma/prisma.service";
import { sortPair } from "../common/utils/sort-pair";

// DECISÃO: "ADICIONAR" abre um pedido de amizade (status PENDING) — o
// destinatário precisa aceitar para a amizade valer e o chat direto ser
// liberado. Supersede a decisão anterior documentada em
// docs/contexto.md § "Amizade, bloqueio e chat" (amizade mútua imediata);
// atualizado para o fluxo de solicitação que o schema já suportava
// (FriendshipStatus sempre teve PENDING/DECLINED/CANCELLED, só não eram
// usados). Reaproveita o par canônico de Match (ver contexto.md §3.2):
// canonicalKey = menor(id):maior(id) — agora via upsert (não
// create+catch P2002), porque um pedido pode legitimamente reescrever uma
// linha DECLINED/CANCELLED anterior para PENDING de novo.
@Injectable()
export class FriendshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatsService: ChatsService,
    private readonly realtime: RealtimeGateway,
    private readonly blocks: BlocksService,
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

  // Botão "ADICIONAR": cria um pedido de amizade PENDING. Se o alvo já
  // tinha pedido pra mim, equivale a aceitar na hora (mesma lógica de
  // reciprocidade do Match — ver §3.2).
  async add(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException("Você não pode adicionar a si mesmo");

    if (await this.blocks.isBlocked(userId, targetId)) {
      throw new ForbiddenException("Não é possível adicionar este usuário");
    }

    const canonicalKey = this.canonicalKey(userId, targetId);
    const existing = await this.prisma.friendship.findUnique({ where: { canonicalKey } });

    if (existing?.status === "ACCEPTED") {
      // Já são amigos (clique duplo, ou dessincronia de UI): idempotente,
      // só garante que o chat exista.
      const chat = await this.chatsService.getOrCreateDirectChat(userId, targetId);
      return { friendshipId: existing.id, chatId: chat.id, status: "ACCEPTED" as const };
    }

    if (existing?.status === "PENDING") {
      if (existing.requesterId === targetId) {
        // O outro lado já tinha pedido — "Adicionar" aqui é aceitar.
        return this.respond(userId, existing.id, true);
      }
      // Já pedi antes e ainda não responderam — idempotente.
      return { friendshipId: existing.id, chatId: null, status: "PENDING" as const };
    }

    // Sem pedido ativo (nunca existiu, ou o anterior foi DECLINED/CANCELLED):
    // upsert reabre a mesma linha como um novo pedido, mesmo padrão de
    // reenvio de Convite (contexto.md §3.5).
    const request = await this.prisma.friendship.upsert({
      where: { canonicalKey },
      create: { requesterId: userId, addresseeId: targetId, canonicalKey, status: "PENDING" },
      update: { requesterId: userId, addresseeId: targetId, status: "PENDING", respondedAt: null },
      select: { id: true },
    });

    await this.realtime.notifyUsers([targetId], "friendship:requested", {
      friendshipId: request.id,
      fromUserId: userId,
    });

    return { friendshipId: request.id, chatId: null, status: "PENDING" as const };
  }

  // Aceitar/recusar um pedido — só o destinatário (addresseeId) pode
  // responder. Aceitar libera (ou reaproveita) o chat direto e notifica os
  // dois lados; recusar é silencioso, mesma política do bloqueio (ver §6).
  async respond(userId: string, friendshipId: string, accept: boolean) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || friendship.addresseeId !== userId) {
      throw new NotFoundException("Solicitação não encontrada");
    }
    if (friendship.status !== "PENDING") {
      throw new ConflictException("Esta solicitação já foi respondida");
    }

    if (!accept) {
      await this.prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "DECLINED", respondedAt: new Date() },
      });
      return { friendshipId, chatId: null, status: "DECLINED" as const };
    }

    await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    const chat = await this.chatsService.getOrCreateDirectChat(friendship.requesterId, friendship.addresseeId);

    await this.realtime.notifyUsers([friendship.requesterId, friendship.addresseeId], "friendship:created", {
      friendshipId,
      chatId: chat.id,
      userIds: [friendship.requesterId, friendship.addresseeId],
    });

    return { friendshipId, chatId: chat.id, status: "ACCEPTED" as const };
  }

  // Pedidos recebidos e ainda não respondidos — seção "Solicitações de
  // amizade" no próprio perfil.
  listPendingRequests(userId: string) {
    return this.prisma.friendship.findMany({
      where: { addresseeId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        requester: { select: { id: true, profile: { select: { displayName: true, photoUrl: true } } } },
      },
    });
  }

  // Amigos (amizade ACCEPTED) de um perfil, para a lista de amigos —
  // filtra bloqueios nos dois sentidos do ponto de vista do viewer, mesma
  // ocultação mútua total do resto do app (ver contexto.md §6.1).
  async listFriends(profileUserId: string, viewerId?: string) {
    const hidden = await this.blocks.getHiddenUserIds(viewerId);

    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: profileUserId }, { addresseeId: profileUserId }],
      },
      orderBy: { respondedAt: "desc" },
      include: {
        requester: { select: { id: true, profile: { select: { displayName: true, photoUrl: true } } } },
        addressee: { select: { id: true, profile: { select: { displayName: true, photoUrl: true } } } },
      },
    });

    return friendships
      .map((f) => (f.requesterId === profileUserId ? f.addressee : f.requester))
      .filter((u) => !hidden.includes(u.id));
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
    if (await this.blocks.isBlocked(blockerId, blockedId)) return;

    await this.chatsService.cancelChatPurge(blockerId, blockedId);
  }

  async removeFriend(userId: string, targetId: string) {
    const canonicalKey = this.canonicalKey(userId, targetId);
    const result = await this.prisma.friendship.deleteMany({ where: { canonicalKey } });
    if (result.count === 0) throw new ConflictException("Vocês não são amigos");
  }
}
