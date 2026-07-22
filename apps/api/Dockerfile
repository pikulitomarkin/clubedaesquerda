# Build da API (NestJS) num monorepo pnpm.
#
# Base Debian slim (não Alpine) DE PROPÓSITO: o engine do Prisma precisa de
# openssl e da libc glibc; em Alpine (musl) ele falha com "failed to detect
# libssl" tanto no `migrate deploy` quanto nas queries. slim + openssl faz o
# target debian-openssl-3.0.x ser detectado e baixado no `prisma generate`.
FROM node:20-slim AS base
RUN apt-get update -qq \
  && apt-get install -y -qq --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
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
# Os pacotes do workspace são compilados para JS ANTES da API: seu `main`
# aponta para dist/, e sem esse build o runtime cairia no .ts fonte
# (SyntaxError). Ordem: shared → database → api.
RUN pnpm --filter @clube/shared build
RUN pnpm --filter @clube/database build
RUN pnpm --filter @clube/api build

# --- runtime: só o necessário para executar -----------------------------
FROM base AS runtime
ENV NODE_ENV=production
# Argon2id é memory-hard por design (19 MiB por hash, contexto.md §1.1).
# Limitar o heap do V8 deixa margem para esses picos sem estourar o
# container inteiro numa máquina de 1 GB.
ENV NODE_OPTIONS="--max-old-space-size=320"

# node_modules vêm do estágio BUILD (não deps): é lá que o `prisma generate`
# escreveu o client gerado e que estão os pacotes buildados. Também inclui o
# CLI do prisma (devDep), necessário para o `migrate deploy` do deploy.sh.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
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
