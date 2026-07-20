import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { sortPair } from "../common/utils/sort-pair";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // DECISÃO: bloqueio torna os perfis mutuamente invisíveis — se existe
  // um Block em qualquer direção entre viewer e o perfil pedido, a API
  // responde 404 (não 403), para não revelar ao bloqueado que foi
  // bloqueado nem que a conta ainda existe. Ver docs/contexto.md §
  // "Amizade, bloqueio e chat".
  async findById(id: string, viewerId?: string) {
    if (viewerId && viewerId !== id) {
      const blocked = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: id },
            { blockerId: id, blockedId: viewerId },
          ],
        },
      });
      if (blocked) throw new NotFoundException("Usuário não encontrado");
    }

    const isSelf = viewerId === id;

    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: isSelf, // e-mail nunca é exposto no perfil de terceiros
        status: true,
        createdAt: true,
        profile: true,
      },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado");

    if (!viewerId || isSelf) return { ...user, viewer: null };

    const [loId, hiId] = sortPair(viewerId, id);
    const [friendship, swipe, match] = await Promise.all([
      this.prisma.friendship.findUnique({ where: { canonicalKey: `${loId}:${hiId}` } }),
      this.prisma.swipe.findUnique({ where: { userId_targetId: { userId: viewerId, targetId: id } } }),
      this.prisma.match.findUnique({ where: { userAId_userBId: { userAId: loId, userBId: hiId } } }),
    ]);

    // Enforcement de Profile.visibility para terceiros. PUBLIC/MEMBERS_ONLY
    // são visíveis a qualquer membro autenticado; MATCHES_ONLY exige match
    // ativo; PRIVATE (e perfil ausente) só o próprio dono. 404, não 403, para
    // não revelar existência — mesma política do bloqueio acima.
    const hasActiveMatch = match?.status === "ACTIVE";
    const visibility = user.profile?.visibility ?? "PRIVATE";
    const canSeeProfile =
      visibility === "PUBLIC" ||
      visibility === "MEMBERS_ONLY" ||
      (visibility === "MATCHES_ONLY" && hasActiveMatch);
    if (!canSeeProfile) throw new NotFoundException("Usuário não encontrado");

    return {
      ...user,
      // Estado da relação entre quem pediu (viewer) e o perfil, usado
      // pelo frontend para decidir quais botões mostrar (GOSTEI já dado,
      // ADICIONAR já é amigo, chat de match já existe).
      viewer: {
        isFriend: friendship?.status === "ACCEPTED",
        hasLiked: swipe?.liked ?? false,
        matchId: hasActiveMatch ? match!.id : null,
      },
    };
  }

  // Soft delete — ver docs/contexto.md §2 (direito ao esquecimento). A
  // anonimização efetiva dos dados pessoais roda em job assíncrono.
  async softDelete(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
