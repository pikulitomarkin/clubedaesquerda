import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class InteressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.interesse.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  }
}
