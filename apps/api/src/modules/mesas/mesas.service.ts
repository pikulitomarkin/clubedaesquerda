import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateMesaDto } from "./dto/create-mesa.dto";

@Injectable()
export class MesasService {
  constructor(private readonly prisma: PrismaService) {}

  // Criar mesa exige vínculo com o contêiner: membro da roda, ou
  // organizador do evento. Antes o método sequer recebia o usuário —
  // qualquer autenticado criava mesa em QUALQUER roda ou evento, com
  // rodaId/eventoId vindos direto do body sem checagem.
  async create(userId: string, dto: CreateMesaDto) {
    if (!dto.rodaId && !dto.eventoId) {
      throw new BadRequestException("Mesa precisa pertencer a uma roda ou a um evento");
    }

    if (dto.rodaId) await this.assertRodaMember(dto.rodaId, userId);

    if (dto.eventoId) {
      const evento = await this.prisma.evento.findUnique({
        where: { id: dto.eventoId },
        select: { organizerId: true },
      });
      if (!evento) throw new NotFoundException("Evento não encontrado");
      if (evento.organizerId !== userId) {
        throw new ForbiddenException("Só quem organiza o evento pode criar mesas nele");
      }
    }

    return this.prisma.mesa.create({ data: dto });
  }

  // 404 (não 403) para não confirmar a existência de uma roda que o
  // usuário não pode ver — mesma política de RodasService.
  private async assertRodaMember(rodaId: string, userId: string) {
    const roda = await this.prisma.roda.findFirst({
      where: { id: rodaId, archivedAt: null },
      select: { id: true },
    });
    if (!roda) throw new NotFoundException("Roda não encontrada");

    const membro = await this.prisma.rodaMembro.findUnique({
      where: { rodaId_userId: { rodaId, userId } },
    });
    if (!membro) throw new NotFoundException("Roda não encontrada");
  }

  async findById(id: string) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id },
      include: {
        roda: { select: { id: true, name: true, slug: true } },
        evento: { select: { id: true, title: true } },
        _count: { select: { participantes: true } },
      },
    });
    if (!mesa) throw new NotFoundException("Mesa não encontrada");
    return mesa;
  }

  async joinMesa(mesaId: string, userId: string) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id: mesaId },
      select: { id: true, capacity: true, rodaId: true },
    });
    if (!mesa) throw new NotFoundException("Mesa não encontrada");

    // Entrar em mesa de roda exige ser membro da roda: sem isto, a mesa era
    // uma porta lateral para dentro de uma roda INVITE_ONLY, contornando o
    // controle de visibilidade aplicado em RodasService.join.
    if (mesa.rodaId) await this.assertRodaMember(mesa.rodaId, userId);

    return this.prisma.$transaction(async (tx) => {
      // Já participa: idempotente, e não consome vaga de novo.
      const existing = await tx.mesaParticipante.findUnique({
        where: { mesaId_userId: { mesaId, userId } },
      });
      if (existing) return existing;

      // Capacidade conferida DENTRO da transação, com a linha da mesa
      // travada (FOR UPDATE). O padrão anterior — contar participantes e
      // depois inserir — era TOCTOU: duas entradas concorrentes na última
      // vaga liam a mesma contagem e ambas passavam (oversell).
      if (mesa.capacity != null) {
        await tx.$queryRaw`SELECT id FROM mesas WHERE id = ${mesaId} FOR UPDATE`;

        const ocupadas = await tx.mesaParticipante.count({ where: { mesaId } });
        if (ocupadas >= mesa.capacity) throw new ConflictException("Mesa lotada");
      }

      return tx.mesaParticipante.create({ data: { mesaId, userId } });
    });
  }
}
