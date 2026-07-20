# Build da API (NestJS) num monorepo pnpm.
#
# A imagem é construída no GitHub Actions e publicada no GHCR — a VPS só faz
# `docker pull`. Motivo: a VPS tem 1 vCPU e 961 MB de RAM; compilar Nest +
# Prisma lá levaria muitos minutos em swap, com risco real de OOM.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# --- deps: instala com o lockfile, aproveitando cache de camada ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# --- build: gera o Prisma Client e compila o Nest -----------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @clube/database exec prisma generate
RUN pnpm --filter @clube/api build

# --- runtime: só o necessário para executar -----------------------------
FROM base AS runtime
ENV NODE_ENV=production
# Argon2id é memory-hard por design (19 MiB por hash, contexto.md §1.1).
# Limitar o heap do V8 deixa margem para esses picos sem estourar o
# container inteiro numa máquina de 1 GB.
ENV NODE_OPTIONS="--max-old-space-size=320"

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY package.json pnpm-workspace.yaml ./

# Diretório de uploads: montado como volume no compose para sobreviver a
# recriação do container.
RUN mkdir -p /app/apps/api/uploads

WORKDIR /app/apps/api
EXPOSE 3333
CMD ["node", "dist/main.js"]
