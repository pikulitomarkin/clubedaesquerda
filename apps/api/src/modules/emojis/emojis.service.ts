import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateEmojiDto } from "./dto/create-emoji.dto";

// Catálogo de emojis personalizados do chat — ver comentário no schema
// (model CustomEmoji) e docs/contexto.md § "Mensagens: links, GIFs e
// emojis". Curadoria fica com ADMIN/MODERATOR (RolesGuard no
// controller); qualquer membro autenticado só lê o catálogo ativo.
@Injectable()
export class EmojisService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.customEmoji.findMany({ where: { active: true }, orderBy: { shortcode: "asc" } });
  }

  create(dto: CreateEmojiDto) {
    return this.prisma.customEmoji.create({ data: dto });
  }

  deactivate(id: string) {
    return this.prisma.customEmoji.update({ where: { id }, data: { active: false } });
  }
}
