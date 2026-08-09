import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { CreateSugestaoDto } from "./dto/create-sugestao.dto";

@Injectable()
export class SugestoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // Persiste (fila de admin, GET /sugestoes) e envia por e-mail para a
  // equipe poder responder direto, sem precisar entrar no painel.
  async create(userId: string, dto: CreateSugestaoDto) {
    const [sugestao, user] = await Promise.all([
      this.prisma.sugestao.create({
        data: { userId, sugiro: dto.sugiro, porque: dto.porque },
        select: { id: true, createdAt: true },
      }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { email: true, profile: { select: { displayName: true } } },
      }),
    ]);

    await this.emailService.sendSugestaoEmail(
      user.email,
      user.profile?.displayName ?? "Usuário",
      dto.sugiro,
      dto.porque,
    );

    return sugestao;
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
