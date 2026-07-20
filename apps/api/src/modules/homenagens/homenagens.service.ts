import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { BlocksService } from "../common/blocks/blocks.service";
import { FriendshipsService } from "../friendships/friendships.service";
import { CreateHomenagemDto } from "./dto/create-homenagem.dto";

// Homenagens só podem ser publicadas entre amigos mútuos — ver
// docs/contexto.md § "Homenagens". `visible` só pode ser alterado pelo
// destinatário (é o "recado na parede" dele, ele decide se aparece).
@Injectable()
export class HomenagensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friendships: FriendshipsService,
    private readonly blocks: BlocksService,
  ) {}

  async create(authorId: string, dto: CreateHomenagemDto) {
    if (authorId === dto.recipientId) {
      throw new BadRequestException("Você não pode homenagear a si mesmo");
    }

    const mutual = await this.friendships.isMutualFriend(authorId, dto.recipientId);
    if (!mutual) {
      throw new ForbiddenException("Homenagens só podem ser enviadas entre amigos mútuos");
    }

    return this.prisma.homenagem.create({
      data: { authorId, recipientId: dto.recipientId, content: dto.content },
    });
  }

  // viewerId === recipientId: vê todas (inclusive ocultas, para gerenciar).
  // Qualquer outro viewer: só as visíveis.
  async listForProfile(profileUserId: string, viewerId: string) {
    const isOwner = viewerId === profileUserId;

    // Ocultação mútua total: homenagens escritas por usuários bloqueados
    // somem para o viewer — inclusive para o dono do perfil, que não deve
    // continuar vendo recados de quem ele bloqueou (nem vice-versa).
    const hidden = await this.blocks.getHiddenUserIds(viewerId);

    return this.prisma.homenagem.findMany({
      where: {
        recipientId: profileUserId,
        ...(isOwner ? {} : { visible: true }),
        authorId: { notIn: hidden },
      },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, profile: { select: { displayName: true, photoUrl: true } } } } },
    });
  }

  async setVisibility(id: string, recipientId: string, visible: boolean) {
    const homenagem = await this.prisma.homenagem.findUnique({ where: { id } });
    if (!homenagem || homenagem.recipientId !== recipientId) {
      throw new NotFoundException("Homenagem não encontrada");
    }

    return this.prisma.homenagem.update({ where: { id }, data: { visible } });
  }
}
