import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateSugestaoDto } from "./dto/create-sugestao.dto";

@Injectable()
export class SugestoesService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateSugestaoDto) {
    return this.prisma.sugestao.create({
      data: { userId, sugiro: dto.sugiro, porque: dto.porque },
      select: { id: true, createdAt: true },
    });
  }

  // Leitura restrita a ADMIN/MODERATOR (ver controller): a sugestão é
  // vinculada a quem escreveu, para permitir a resposta por e-mail.
  listQueue(cursor?: string, take = 30) {
    return this.prisma.sugestao.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
      },
    });
  }
}
