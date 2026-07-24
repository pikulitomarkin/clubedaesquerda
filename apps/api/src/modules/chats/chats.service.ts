import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ulid } from "ulid";
import { PrismaService } from "../common/prisma/prisma.service";
import { BlocksService } from "../common/blocks/blocks.service";
import { SendMessageDto } from "./dto/send-message.dto";
import { CreateGroupChatDto } from "./dto/create-group-chat.dto";

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

  // Inbox do usuário ("Roda de Conversa"): lista tanto DIRECT (mostrada só
  // pelo nome da outra pessoa) quanto GROUP — de comunidade (Roda) ou
  // avulso (criado direto daqui). Até 2 podem estar "abertos" na UI ao
  // mesmo tempo (ver docs/contexto.md § "Até 2 abas de chat"), mas essa é
  // uma restrição só de client — a API lista todos para o usuário escolher.
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
        // GROUP de comunidade usa nome/imagem da Roda; GROUP avulso usa os
        // próprios name/imageUrl do Chat (ver migration "chat_grupo_avulso").
        name: chat.roda?.name ?? chat.name,
        imageUrl: chat.roda?.imageUrl ?? chat.imageUrl,
        isCreator: chat.creatorId === userId,
        otherUser: chat.type === "DIRECT" ? (chat.participants[0]?.user ?? null) : null,
        lastMessage: chat.messages[0] ?? null,
      }))
      .sort((a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0));
  }

  // Botão "RODA DE CONVERSA" acima da lista — cria um grupo avulso (sem
  // vínculo com uma Roda/comunidade). Pares bloqueados são excluídos em
  // silêncio da lista de participantes (mesma política de silêncio do
  // bloqueio em outros fluxos), não rejeitados com erro — evita confirmar
  // ao criador que existe bloqueio com alguém específico.
  async createGroupChat(creatorId: string, dto: CreateGroupChatDto) {
    const candidates = [...new Set(dto.participantIds)].filter((id) => id !== creatorId);

    const blockChecks = await Promise.all(
      candidates.map(async (id) => ({ id, blocked: await this.blocks.isBlocked(creatorId, id) })),
    );
    const allowed = blockChecks.filter((c) => !c.blocked).map((c) => c.id);

    if (allowed.length === 0) {
      throw new BadRequestException("Selecione ao menos uma pessoa");
    }

    return this.prisma.chat.create({
      data: {
        type: "GROUP",
        name: dto.name,
        imageUrl: dto.imageUrl,
        creatorId,
        participants: { create: [creatorId, ...allowed].map((userId) => ({ userId })) },
      },
      include: { participants: true },
    });
  }

  // Botão "SAIR" — qualquer membro, exceto o criador (que só pode
  // "FECHAR RODA"). Só vale para grupo avulso: uma Roda de comunidade tem
  // seu próprio fluxo de saída (RodasService.leave), que já lida com
  // RodaMembro/participação em Mesas — este método aqui não se aplica a
  // chats com rodaId preenchido.
  async leaveGroupChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || chat.type !== "GROUP" || chat.rodaId) {
      throw new NotFoundException("Roda de conversa não encontrada");
    }
    if (chat.creatorId === userId) {
      throw new ForbiddenException('Quem criou a roda de conversa não pode sair — use "Fechar roda"');
    }

    const removed = await this.prisma.chatParticipant.deleteMany({ where: { chatId, userId } });
    if (removed.count === 0) throw new ForbiddenException("Você não participa desta roda de conversa");
  }

  // Botão "FECHAR RODA" — só o criador. Diferente do fechamento de Roda de
  // comunidade (que arquiva com retenção de 48h para moderação, ver
  // RodasService.close), aqui o spec do cliente pede descarte imediato:
  // "o chat desaparece para todos e seus dados são descartados". Delete
  // direto, cascata apaga ChatParticipant/Message (e Reaction nas
  // mensagens). Retorna os participantes ANTES de apagar, para o
  // controller notificar via realtime (fechar a aba de quem estiver com
  // ela aberta) — mesmo padrão de RodasService.close.
  async closeGroupChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });
    if (!chat || chat.type !== "GROUP" || chat.rodaId) {
      throw new NotFoundException("Roda de conversa não encontrada");
    }
    if (chat.creatorId !== userId) {
      throw new ForbiddenException("Só quem criou a roda de conversa pode fechá-la");
    }

    const participantIds = chat.participants.map((p) => p.userId);
    await this.prisma.chat.delete({ where: { id: chatId } });
    return { participantIds };
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

  // Botão "CONVERSAR" do perfil — qualquer pessoa pode iniciar, sem
  // precisar ser amigo/match (essa é a diferença para o fluxo de
  // ADICIONAR, que também usa getOrCreateDirectChat mas nasce de uma
  // amizade). Único ponto de entrada público, por isso é aqui que o
  // bloqueio é checado — getOrCreateDirectChat em si não checa, pois
  // também é chamado internamente por fluxos que já garantiram isso
  // (ex.: FriendshipsService.add só chega aqui após a própria checagem).
  async startDirectChat(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new ForbiddenException("Você não pode conversar consigo mesmo");
    }
    if (await this.blocks.isBlocked(userId, targetId)) {
      // 403 genérico: não confirma se o bloqueio existe nem em qual
      // direção, mesma política de silêncio do resto do bloqueio.
      throw new ForbiddenException("Não é possível iniciar esta conversa");
    }
    return this.getOrCreateDirectChat(userId, targetId);
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
