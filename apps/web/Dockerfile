# Build do frontend (Next.js 14 App Router) num monorepo pnpm.
#
# Usa `output: "standalone"` (ver next.config.mjs): o Next monta uma pasta
# com apenas os arquivos realmente necessários para rodar, em vez de exigir
# node_modules inteiro. Numa VPS de 961 MB isso é a diferença entre caber e
# não caber.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
# NEXT_PUBLIC_* é embutido no bundle em tempo de build, não em runtime —
# por isso precisa entrar como build-arg (ver .github/workflows/deploy.yml).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
RUN pnpm --filter @clube/web build

FROM base AS runtime
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"
ENV PORT=3000

# O standalone já traz suas dependências; static/ e public/ vão à parte
# porque o Next não os inclui no bundle standalone.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
