import { ForbiddenException, Injectable } from "@nestjs/common";
import { ulid } from "ulid";
import { PrismaService } from "../common/prisma/prisma.service";
import { BlocksService } from "../common/blocks/blocks.service";
import { SendMessageDto } from "./dto/send-message.dto";

// Retenção pós-bloqueio — ver docs/contexto.md § "Retenção após
// bloqueio". 48h após o bloqueio, o job de expurgo (ChatRetentionJob)
// apaga definitivamente o chat e as mensagens.
export const CHAT_PURGE_RETENTION_MS = 48 * 60 * 60_000;

// Ver docs/contexto.md §3.3 — id ULID (monotônico por tempo de geração)
// como critério primário de ordenação, resiliente a corrida entre
// INSERTs concorrentes no mesmo chat.
@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const participants = await this.assertAccess(dto.chatId, senderId);

    const message = await this.prisma.message.create({
      data: {
        id: ulid(),
        chatId: dto.chatId,
        senderId,
        type: dto.type,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
      },
    });

    return { message, participantIds: participants.map((p) => p.userId) };
  }

  async listMessages(chatId: string, userId: string, cursor?: string, take = 30) {
    await this.assertAccess(chatId, userId);

    // Ocultação mútua total: em chat de roda (GROUP), mensagens de usuários
    // bloqueados somem para o viewer. Chats DIRECT já ficam inteiramente
    // inacessíveis em assertAccess quando há bloqueio, então este filtro é
    // efetivamente o do espaço compartilhado.
    const hidden = await this.blocks.getHiddenUserIds(userId);

    return this.prisma.message.findMany({
      where: { chatId, deletedAt: null, senderId: { notIn: hidden } },
      orderBy: { id: "desc" },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  // Inbox do usuário: até 2 podem estar "abertos" na UI ao mesmo tempo
  // (ver docs/contexto.md § "Até 2 abas de chat"), mas essa é uma
  // restrição só de client — a API lista todos os chats do usuário para
  // que ele escolha quais abrir.
  async listMyChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { participants: { some: { userId } }, purgeAt: null },
      include: {
        roda: { select: { id: true, name: true, imageUrl: true } },
        participants: {
          where: { userId: { not: userId } },
          select: { user: { select: { id: true, profile: { select: { displayName: true, photoUrl: true } } } } },
        },
        messages: { orderBy: { id: "desc" }, take: 1 },
      },
    });

    return chats
      .map((chat) => ({
        id: chat.id,
        type: chat.type,
        roda: chat.roda,
        otherUser: chat.type === "DIRECT" ? (chat.participants[0]?.user ?? null) : null,
        lastMessage: chat.messages[0] ?? null,
      }))
      .sort((a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0));
  }

  // Usado por Friendship ao adicionar (o Match cria seu próprio chat
  // dentro da mesma transação do INSERT do match — ver contexto.md
  // §3.2 — porque ali a atomicidade com a criação do match importa;
  // aqui não há essa exigência). Idempotente: clique duplo em
  // "ADICIONAR" converge para o mesmo chat via a busca por participantes
  // abaixo, sem duplicar.
  async getOrCreateDirectChat(userAId: string, userBId: string) {
    const existingDirect = await this.prisma.chat.findFirst({
      where: {
        type: "DIRECT",
        matchId: null,
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
      },
    });
    if (existingDirect) return existingDirect;

    return this.prisma.chat.create({
      data: {
        type: "DIRECT",
        participants: { create: [{ userId: userAId }, { userId: userBId }] },
      },
    });
  }

  // Chamado por FriendshipsService.block(): agenda o expurgo de TODO
  // chat DIRECT entre o par (pode existir mais de um — um nascido de
  // Match e outro de "ADICIONAR", já que getOrCreateDirectChat não
  // reaproveita o chat de um Match). Ver docs/contexto.md § "Retenção
  // após bloqueio".
  async scheduleChatPurge(userAId: string, userBId: string) {
    await this.prisma.chat.updateMany({
      where: {
        type: "DIRECT",
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
      },
      data: { purgeAt: new Date(Date.now() + CHAT_PURGE_RETENTION_MS) },
    });
  }

  // Chamado por FriendshipsService.unblock(): se o desbloqueio acontece
  // antes do expurgo rodar, cancela o expurgo agendado — as partes
  // voltam a poder acessar o histórico.
  async cancelChatPurge(userAId: string, userBId: string) {
    await this.prisma.chat.updateMany({
      where: {
        type: "DIRECT",
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
      },
      data: { purgeAt: null },
    });
  }

  // Verifica participação E, para chats DIRECT, que não há bloqueio
  // ativo entre os dois lados — bloquear alguém corta o acesso ao chat
  // de imediato, mesmo que o histórico só seja apagado 48h depois (ver
  // docs/contexto.md § "Retenção após bloqueio"). Chats de Roda (GROUP)
  // não são afetados por bloqueios 1:1 entre dois membros.
  private async assertAccess(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat || !chat.participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException("Você não participa deste chat");
    }

    // Chat com expurgo agendado está encerrado do ponto de vista do produto,
    // mesmo que o job ainda não tenha rodado: vale tanto para chat DIRECT
    // após bloqueio quanto para o chat de uma roda fechada (arquivada).
    if (chat.purgeAt) {
      throw new ForbiddenException("Este chat não está mais disponível");
    }

    if (chat.type === "DIRECT") {
      const otherUserId = chat.participants.find((p) => p.userId !== userId)?.userId;
      if (otherUserId) {
        const blocked = await this.prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: userId, blockedId: otherUserId },
              { blockerId: otherUserId, blockedId: userId },
            ],
          },
        });
        if (blocked) throw new ForbiddenException("Este chat não está mais disponível");
      }
    }

    return chat.participants;
  }
}
