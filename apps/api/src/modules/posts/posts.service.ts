import { Injectable, NotFoundException } from "@nestjs/common";
import { ReactionType } from "@clube/database";
import { PrismaService } from "../common/prisma/prisma.service";
import { BlocksService } from "../common/blocks/blocks.service";
import { CreatePostDto } from "./dto/create-post.dto";

const AUTHOR_SELECT = {
  select: { id: true, profile: { select: { displayName: true, photoUrl: true } } },
} as const;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
  ) {}

  // authorId nunca é omitido — não existe post anônimo (ver comentário no
  // schema). dto.mesaId e dto.rodaId são independentes: um post pode
  // pertencer a uma Mesa sem repetir o rodaId da roda-mãe da mesa.
  create(authorId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        authorId,
        rodaId: dto.rodaId,
        mesaId: dto.mesaId,
        content: dto.content,
        mediaUrls: dto.mediaUrls ?? [],
        visibility: dto.visibility,
      },
    });
  }

  // Ocultação mútua total (ver BlocksService): posts de usuários bloqueados
  // não aparecem no feed da roda nem contam suas reações, mesmo em roda
  // pública da qual ambos participam. `viewerId` é opcional porque a rota é
  // pública (OptionalJwtAuthGuard) — anônimo não tem bloqueios e vê tudo.
  async listByRoda(rodaId: string, viewerId?: string, cursor?: string, take = 20) {
    const hidden = await this.blocks.getHiddenUserIds(viewerId);

    const posts = await this.prisma.post.findMany({
      // roda.archivedAt: posts de uma roda fechada somem imediatamente,
      // ainda que as linhas só sejam apagadas no expurgo de 48h.
      where: { rodaId, deletedAt: null, authorId: { notIn: hidden }, roda: { archivedAt: null } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { author: AUTHOR_SELECT },
    });

    return this.attachReactionSummary(posts, viewerId, hidden);
  }

  // Posts nas Mesas — ver docs/contexto.md § "Posts nas Mesas". Mesmo
  // formato de listByRoda (autor sempre incluso, resumo de reações),
  // trocando só o campo de filtro.
  async listByMesa(mesaId: string, viewerId?: string, cursor?: string, take = 20) {
    const hidden = await this.blocks.getHiddenUserIds(viewerId);

    const posts = await this.prisma.post.findMany({
      where: { mesaId, deletedAt: null, authorId: { notIn: hidden } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { author: AUTHOR_SELECT },
    });

    return this.attachReactionSummary(posts, viewerId, hidden);
  }

  // updateMany + checagem de count: com `update`, tentar apagar post alheio
  // não casava o where e o Prisma lançava P2025 não tratado — 500, que
  // ainda por cima confirmava a existência do post. Agora é 404 uniforme,
  // igual para "não existe" e "não é seu".
  async softDelete(id: string, authorId: string) {
    const result = await this.prisma.post.updateMany({
      where: { id, authorId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException("Post não encontrado");
  }

  // Contagem numérica por tipo de reação (UAU!/FERA/EITA/NOPS/PERAÍ) +
  // qual reação o próprio viewer já deu (para a UI destacar o botão
  // ativo) — ver docs/contexto.md § "Sistema de reações". Duas queries
  // extra por página em vez de uma por post: o custo é fixo (não escala
  // com o número de posts retornados).
  private async attachReactionSummary<T extends { id: string }>(
    posts: T[],
    viewerId: string | undefined,
    hidden: string[],
  ) {
    if (posts.length === 0) return [];

    const postIds = posts.map((p) => p.id);

    const [grouped, viewerReactions] = await Promise.all([
      this.prisma.reaction.groupBy({
        by: ["targetId", "type"],
        where: { targetType: "POST", targetId: { in: postIds }, userId: { notIn: hidden } },
        _count: true,
      }),
      viewerId
        ? this.prisma.reaction.findMany({
            where: { targetType: "POST", targetId: { in: postIds }, userId: viewerId },
            select: { targetId: true, type: true },
          })
        : Promise.resolve([]),
    ]);

    const countsByPost = new Map<string, Partial<Record<ReactionType, number>>>();
    for (const row of grouped) {
      const forPost = countsByPost.get(row.targetId) ?? {};
      forPost[row.type] = row._count;
      countsByPost.set(row.targetId, forPost);
    }

    const viewerReactionByPost = new Map(viewerReactions.map((r) => [r.targetId, r.type]));

    return posts.map((post) => ({
      ...post,
      reactionCounts: countsByPost.get(post.id) ?? {},
      viewerReaction: viewerReactionByPost.get(post.id) ?? null,
    }));
  }
}
