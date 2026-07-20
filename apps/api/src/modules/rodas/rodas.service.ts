import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { BlocksService } from "../common/blocks/blocks.service";
import { CHAT_PURGE_RETENTION_MS } from "../chats/chats.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { CreateRodaDto } from "./dto/create-roda.dto";

const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class RodasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(ownerId: string, dto: CreateRodaDto) {
    return this.prisma.$transaction(async (tx) => {
      const roda = await tx.roda.create({
        data: {
          name: dto.name,
          slug: `${slugify(dto.name)}-${Date.now().toString(36)}`,
          description: dto.description,
          imageUrl: dto.imageUrl,
          bandeiraId: dto.bandeiraId,
          visibility: dto.visibility,
          membros: { create: [{ userId: ownerId, role: "OWNER" }] },
        },
      });

      await tx.chat.create({
        data: { type: "GROUP", rodaId: roda.id, participants: { create: [{ userId: ownerId }] } },
      });

      return roda;
    });
  }

  // Aplica Roda.visibility na entrada: sem esta checagem, qualquer usuário
  // autenticado entrava numa roda INVITE_ONLY via POST /rodas/:id/membros e,
  // como o join também insere um ChatParticipant, passava a ler todo o
  // histórico do chat privado da roda.
  //   PUBLIC / MEMBERS_ONLY -> qualquer membro autenticado entra (a rota já
  //     exige JWT, então "members only" está satisfeito).
  //   INVITE_ONLY -> só quem já é membro (convite/inclusão é feita fora
  //     deste fluxo); demais recebem 404 para não revelar a existência.
  async join(rodaId: string, userId: string) {
    const roda = await this.prisma.roda.findFirst({
      where: { id: rodaId, archivedAt: null },
      select: { visibility: true },
    });
    if (!roda) throw new NotFoundException("Roda não encontrada");

    if (roda.visibility === "INVITE_ONLY") {
      const membro = await this.prisma.rodaMembro.findUnique({
        where: { rodaId_userId: { rodaId, userId } },
      });
      if (!membro) throw new NotFoundException("Roda não encontrada");
    }

    return this.prisma.$transaction(async (tx) => {
      const membro = await tx.rodaMembro.upsert({
        where: { rodaId_userId: { rodaId, userId } },
        update: {},
        create: { rodaId, userId, role: "MEMBER" },
      });

      const chat = await tx.chat.findUnique({ where: { rodaId } });
      if (chat) {
        await tx.chatParticipant.upsert({
          where: { chatId_userId: { chatId: chat.id, userId } },
          update: {},
          create: { chatId: chat.id, userId },
        });
      }

      return membro;
    });
  }

  // Botão "SAIR" — só para membros comuns. O criador não pode sair por
  // aqui (ver docs/contexto.md § "Roda de Conversa: SAIR vs. FECHAR
  // RODA") porque uma roda sem dono cria ambiguidade sobre quem pode
  // administrá-la; a única saída para o criador é encerrar a roda
  // inteira via close().
  async leave(rodaId: string, userId: string) {
    const membro = await this.prisma.rodaMembro.findUnique({ where: { rodaId_userId: { rodaId, userId } } });
    if (!membro) throw new NotFoundException("Você não participa desta roda");
    if (membro.role === "OWNER") {
      throw new ForbiddenException("Quem criou a roda não pode sair — use \"Fechar roda\"");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rodaMembro.delete({ where: { rodaId_userId: { rodaId, userId } } });
      const chat = await tx.chat.findUnique({ where: { rodaId } });
      if (chat) {
        await tx.chatParticipant.deleteMany({ where: { chatId: chat.id, userId } });
      }
      // Sem isto, quem sai da roda continua listado como participante das
      // mesas dela — presença residual numa roda da qual não faz mais parte.
      await tx.mesaParticipante.deleteMany({ where: { userId, mesa: { rodaId } } });
    });
  }

  // Botão "FECHAR RODA".
  //
  // ARQUIVA (soft) em vez de apagar na hora. O delete definitivo — com
  // cascata Roda -> {Chat -> Message/ChatParticipant, RodaMembro, Mesa,
  // Post} — acontece 48h depois, no ChatRetentionJob. Motivo: o delete
  // imediato permitia que o dono de uma roda destruísse instantaneamente
  // todas as mensagens e posts dela, inclusive a evidência de assédio
  // ocorrido ali, sem nenhuma janela de moderação — o oposto da retenção
  // de 48h já adotada no bloqueio (contexto.md §9.4).
  //
  // Também aceita ADMIN/MODERATOR da plataforma: antes, só o OWNER podia
  // fechar, então não havia caminho para moderar uma roda abusiva — e uma
  // roda cujo dono fosse banido ficava permanentemente órfã (o dono não
  // pode sair, e ninguém mais podia fechar).
  async close(rodaId: string, userId: string, actorRole: string) {
    const roda = await this.prisma.roda.findFirst({
      where: { id: rodaId, archivedAt: null },
      include: { membros: { select: { userId: true, role: true } }, chat: { select: { id: true } } },
    });
    if (!roda) throw new NotFoundException("Roda não encontrada");

    const isOwner = roda.membros.some((m) => m.userId === userId && m.role === "OWNER");
    const isPlatformStaff = actorRole === "ADMIN" || actorRole === "MODERATOR";
    if (!isOwner && !isPlatformStaff) {
      throw new ForbiddenException("Só quem criou a roda pode fechá-la");
    }

    const memberIds = roda.membros.map((m) => m.userId);
    const chatId = roda.chat?.id;

    // Condicional: dois cliques simultâneos em "FECHAR RODA" — o segundo
    // encontra count 0 e vira 404, em vez do P2025 não tratado (500) do
    // delete direto anterior.
    const archived = await this.prisma.roda.updateMany({
      where: { id: rodaId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    if (archived.count === 0) throw new NotFoundException("Roda não encontrada");

    // purgeAt no chat da roda cumpre dois papéis: some do inbox na hora
    // (listMyChats filtra purgeAt null) e o acesso é negado em assertAccess.
    await this.prisma.chat.updateMany({
      where: { rodaId },
      data: { purgeAt: new Date(Date.now() + CHAT_PURGE_RETENTION_MS) },
    });

    await this.realtime.notifyUsers(memberIds, "roda:closed", { rodaId, chatId });
  }

  // Rodas exibidas no perfil (com a imagem da roda) — ver
  // docs/contexto.md § "Entrada na Roda". Não filtra bloqueio aqui: quem
  // chega até este endpoint já passou pelo 404 de UsersService.findById
  // se houvesse bloqueio entre viewer e dono do perfil.
  async listForUser(userId: string) {
    const memberships = await this.prisma.rodaMembro.findMany({
      where: { userId, roda: { archivedAt: null } },
      orderBy: { joinedAt: "desc" },
      include: { roda: { select: { id: true, slug: true, name: true, imageUrl: true } } },
    });
    return memberships.map((m) => ({ ...m.roda, role: m.role, joinedAt: m.joinedAt }));
  }

  // Ocultação mútua total: membros bloqueados não aparecem na lista de
  // participantes da roda para o viewer. `viewerId` é opcional porque a
  // rota é pública (OptionalJwtAuthGuard); anônimo não tem bloqueios.
  async findBySlug(slug: string, viewerId?: string) {
    const hidden = await this.blocks.getHiddenUserIds(viewerId);

    const roda = await this.prisma.roda.findFirst({
      where: { slug, archivedAt: null },
      include: {
        bandeira: true,
        membros: { where: { userId: { notIn: hidden } }, take: 20 },
        chat: { select: { id: true } },
      },
    });
    if (!roda) throw new NotFoundException("Roda não encontrada");

    // Mesma aplicação de visibilidade do join(). 404 (não 403) para não
    // confirmar a existência de uma roda que o viewer não pode ver.
    if (roda.visibility !== "PUBLIC") {
      if (!viewerId) throw new NotFoundException("Roda não encontrada");

      if (roda.visibility === "INVITE_ONLY") {
        const membro = await this.prisma.rodaMembro.findUnique({
          where: { rodaId_userId: { rodaId: roda.id, userId: viewerId } },
        });
        if (!membro) throw new NotFoundException("Roda não encontrada");
      }
    }

    return roda;
  }
}
