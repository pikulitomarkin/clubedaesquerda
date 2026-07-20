import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class BandeirasService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.bandeira.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  }
}
