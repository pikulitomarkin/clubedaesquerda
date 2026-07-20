import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Primitiva central de bloqueio.
//
// SEMÂNTICA ADOTADA: **ocultação mútua total**. Bloqueador e bloqueado
// deixam de ver conteúdo e presença um do outro em TODAS as superfícies —
// inclusive espaços públicos compartilhados (posts e mensagens de uma roda
// da qual ambos participam, listas de membros, homenagens) — e não apenas
// na interação 1:1 (perfil, chat direto, match, amizade).
//
// O bloqueio permanece silencioso: nada nas respostas revela ao bloqueado
// que ele foi bloqueado; o conteúdo simplesmente não existe do seu ponto
// de vista.
@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  // Ids de todos os usuários com bloqueio em QUALQUER direção com o viewer.
  // Pensado para ser usado como `notIn` nos filtros de leitura — com lista
  // vazia, `notIn: []` é no-op no Prisma, então o caller não precisa
  // ramificar. Viewer anônimo não tem relação de bloqueio: retorna [].
  async getHiddenUserIds(viewerId?: string): Promise<string[]> {
    if (!viewerId) return [];

    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
      select: { blockerId: true, blockedId: true },
    });

    const hidden = new Set<string>();
    for (const block of blocks) {
      hidden.add(block.blockerId === viewerId ? block.blockedId : block.blockerId);
    }
    return [...hidden];
  }

  // Bloqueio em qualquer direção entre dois usuários. Usado para barrar
  // ações de escrita (ex.: reagir ao conteúdo de quem te bloqueou).
  async isBlocked(userAId: string, userBId: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
      select: { id: true },
    });
    return !!block;
  }
}
