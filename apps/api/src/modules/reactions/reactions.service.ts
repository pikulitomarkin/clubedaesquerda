import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { BlocksService } from "../common/blocks/blocks.service";
import { ReactDto } from "./dto/react.dto";

@Injectable()
export class ReactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
  ) {}

  // upsert por (userId, targetType, targetId): trocar de reação é UPDATE,
  // não gera linha duplicada — ver comentário no schema.prisma.
  async react(userId: string, dto: ReactDto) {
    // Ocultação mútua total: sob bloqueio o conteúdo do outro não existe
    // para o viewer, então reagir a ele também não pode. A mensagem é
    // genérica para não revelar que existe um bloqueio.
    const ownerId = await this.resolveTargetOwner(dto.targetType, dto.targetId);
    if (ownerId && ownerId !== userId && (await this.blocks.isBlocked(userId, ownerId))) {
      throw new ForbiddenException("Conteúdo indisponível");
    }

    return this.prisma.reaction.upsert({
      where: { userId_targetType_targetId: { userId, targetType: dto.targetType, targetId: dto.targetId } },
      update: { type: dto.type },
      create: {
        userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        type: dto.type,
        postId: dto.targetType === "POST" ? dto.targetId : undefined,
        messageId: dto.targetType === "MESSAGE" ? dto.targetId : undefined,
      },
    });
  }

  unreact(userId: string, targetType: ReactDto["targetType"], targetId: string) {
    return this.prisma.reaction.delete({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
  }

  // Autor do conteúdo alvo, para checagem de bloqueio. Null quando o alvo
  // não existe — nesse caso deixamos o upsert seguir e falhar naturalmente
  // (não é papel desta checagem validar existência).
  private async resolveTargetOwner(targetType: ReactDto["targetType"], targetId: string) {
    if (targetType === "POST") {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      return post?.authorId ?? null;
    }

    const message = await this.prisma.message.findUnique({
      where: { id: targetId },
      select: { senderId: true },
    });
    return message?.senderId ?? null;
  }
}
