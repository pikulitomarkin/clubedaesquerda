import { PrismaClient } from "@prisma/client";

// Singleton do PrismaClient compartilhado entre os módulos da API.
// Em dev, evita recriar conexões a cada hot-reload reaproveitando a
// instância anexada ao objeto global.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
