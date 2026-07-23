import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  // Perfil completo do próprio usuário, incluindo os ids de bandeiras e
  // interesses já selecionados — usado para pré-preencher o formulário
  // de edição (o GET /users/:id "público" não expõe essas listas cruas).
  async getMe(userId: string) {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
      include: {
        profileBandeiras: { select: { bandeiraId: true }, orderBy: { priority: "asc" } },
        profileInteresses: { select: { interesseId: true } },
      },
    });

    return {
      ...profile,
      bandeiraIds: profile.profileBandeiras.map((b) => b.bandeiraId),
      interesseIds: profile.profileInteresses.map((i) => i.interesseId),
    };
  }

  async update(userId: string, dto: UpdateProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.update({
        where: { userId },
        data: {
          displayName: dto.displayName,
          bio: dto.bio,
          city: dto.city,
          state: dto.state,
          // A galeria é a fonte de verdade; photoUrl (avatar) espelha a
          // primeira foto. Assim feed, chat, eventos e homenagens — que já
          // leem photoUrl — continuam funcionando sem alteração.
          ...(dto.photos
            ? { photos: dto.photos, photoUrl: dto.photos[0] ?? null }
            : {}),
        },
      });

      if (dto.bandeiraIds) {
        await tx.profileBandeira.deleteMany({ where: { profileId: profile.id } });
        await tx.profileBandeira.createMany({
          data: dto.bandeiraIds.map((bandeiraId, priority) => ({ profileId: profile.id, bandeiraId, priority })),
        });
      }

      if (dto.interesseIds) {
        await tx.profileInteresse.deleteMany({ where: { profileId: profile.id } });
        await tx.profileInteresse.createMany({
          data: dto.interesseIds.map((interesseId) => ({ profileId: profile.id, interesseId })),
        });
      }

      return profile;
    });
  }
}
