# Arquitetura — Clube da Esquerda

Visão geral da arquitetura inicial. Para decisões detalhadas de
autenticação, LGPD e concorrência, ver [`contexto.md`](./contexto.md).
Para o modelo de dados completo, ver [`erd.md`](./erd.md) e
[`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma).

## Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript | SSR/SSG para SEO em conteúdo público (rodas, eventos), Server Components reduzem payload em feeds |
| Backend | NestJS, TypeScript | Estrutura modular por domínio, DI nativa, guards/interceptors prontos para auth e rate limiting |
| Banco | PostgreSQL 16 | Transacional, suporta todas as garantias de concorrência do MVP sem infra adicional (ver contexto.md §4) |
| ORM | Prisma | Migrations versionadas, schema único como fonte de verdade, types compartilhados |
| Auth | JWT (access) + refresh token opaco rotacionado | Ver contexto.md §1 |
| Real-time | WebSocket (NestJS Gateway) + Redis Pub/Sub | Fanout de chat entre instâncias da API |
| Monorepo | pnpm workspaces + Turborepo | Build cacheado, pipelines paralelas, código compartilhado (tipos, DTOs) entre web e api |

## Estrutura de pastas

```
clube-da-esquerda/
├── apps/
│   ├── web/                      # Next.js App Router
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── cadastro/
│   │   │   │   └── verificar-email/
│   │   │   ├── feed/              # (placeholder — vira (main)/feed quando as demais rotas forem adicionadas)
│   │   │   ├── perfil/[id]/       # Gostei/Adicionar/Bloquear/Denunciar + Homenagens
│   │   │   ├── rodas/
│   │   │   │   ├── nova/          # criação de Roda de Conversa (nome + imagem)
│   │   │   │   └── [slug]/        # Entrar/Abrir chat/Sair/Fechar roda
│   │   │   ├── chats/[chatId]/    # deep-link: abre a conversa na dock e volta pro feed
│   │   │   ├── design-system/     # showcase dos componentes de UI
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── chat/          # ChatDock, ChatWindow, EmojiPicker, GifPicker, MessageContent
│   │   │   ├── lib/                # api client, auth-context / chat-dock-context / realtime-context (React), constants
│   │   │   └── styles/             # design-system.css, design-tokens.ts
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                      # NestJS
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/         # login, cadastro, refresh, verificação de e-mail, guards, argon2/jwt
│       │   │   ├── email/        # EmailService (Nodemailer/SMTP genérico)
│       │   │   ├── users/
│       │   │   ├── profiles/
│       │   │   ├── bandeiras/
│       │   │   ├── interesses/
│       │   │   ├── friendships/  # amizades + bloqueios
│       │   │   ├── matches/      # swipes + matches
│       │   │   ├── realtime/     # RealtimeGateway (WS único da API, ver contexto.md §5)
│       │   │   ├── chats/        # chats + mensagens + ChatRetentionJob (expurgo pós-bloqueio)
│       │   │   ├── emojis/       # catálogo de emojis personalizados do chat
│       │   │   ├── gifs/         # proxy de busca de GIF (Tenor) — chave só no backend
│       │   │   ├── rodas/
│       │   │   ├── mesas/
│       │   │   ├── posts/
│       │   │   ├── reactions/
│       │   │   ├── homenagens/
│       │   │   ├── reports/      # denúncia de perfil + fila de moderação
│       │   │   ├── uploads/      # POST /uploads (multer, disco local)
│       │   │   ├── events/       # eventos + convites + confirmações
│       │   │   └── common/       # guards, decorators, filters, interceptors
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── database/                 # Prisma schema, migrations, client singleton
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/index.ts
│   │   └── package.json
│   │
│   └── shared/                   # DTOs/tipos/validação (zod) compartilhados web+api
│       ├── src/
│       └── package.json
│
├── docs/
│   ├── architecture.md           # este arquivo
│   ├── contexto.md               # decisões de auth, LGPD, concorrência
│   └── erd.md                    # diagrama de entidades
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Módulos da API por domínio

Cada módulo NestJS segue o padrão `module + controller + service (+
gateway quando aplicável)`, injetando o `PrismaService` de
`@clube/database`:

- **auth** — estratégias Passport (`CpfPasswordStrategy`, `JwtStrategy`,
  `JwtRefreshStrategy`), `AuthController` (`/auth/register`,
  `/auth/login`, `/auth/refresh`, `/auth/logout`), `ThrottlerGuard` para
  rate limiting de login/cadastro.
- **users / profiles** — CRUD de conta e perfil, upload de foto,
  gerência de bandeiras/interesses do perfil.
- **bandeiras / interesses** — catálogos administráveis (somente
  `ADMIN`/`MODERATOR` escrevem).
- **friendships** — pedidos de amizade e bloqueios; todo endpoint de
  listagem de perfil/feed filtra usuários bloqueados.
- **matches** — registro de swipes, criação de match (transação
  descrita em contexto.md §3.2), criação do chat associado.
- **chats** — histórico de mensagens (REST, paginação por cursor usando
  o `id` ULID) + `ChatGateway` (WebSocket) para envio/recebimento em
  tempo real e presença.
- **rodas / mesas** — comunidades temáticas, membros, mesas de
  discussão vinculadas a rodas ou eventos.
- **posts / reactions** — mural pessoal e de rodas, reações
  polimórficas.
- **events** — eventos (presencial/online/clube/análise), convites,
  confirmações com controle de capacidade (contexto.md §3.4).

## Fronteiras e comunicação

- **web → api**: REST/JSON autenticado via JWT (`Authorization: Bearer`
  para chamadas client-side; cookie httpOnly para o refresh token) +
  WebSocket para chat em tempo real.
- **web (Server Components)**: chamadas server-to-server à API interna,
  reduzindo round-trips do browser em páginas de feed/perfil.
- **api → postgres**: exclusivamente via Prisma Client, sem SQL cru
  fora dos casos documentados em `contexto.md` (que são expressos como
  `$queryRaw`/`$executeRaw` justamente para garantir a semântica atômica
  de `ON CONFLICT` e updates condicionais que o Prisma não expõe de
  forma ergonômica na API alto-nível).
- **tipos compartilhados**: `packages/shared` exporta schemas `zod`
  (validação de DTOs) e tipos TypeScript derivados, usados tanto pelos
  `class-validator` DTOs do NestJS (via adaptação) quanto pelos
  formulários do Next.js — único ponto de verdade para forma dos dados
  trafegados entre as duas apps.

## Evolução prevista (fora do escopo do MVP)

- Cache de leitura (Redis) para perfis/feeds de alto tráfego.
- Fila de mensageria (ex.: BullMQ sobre Redis, ou SQS) para e-mails
  transacionais, promoção em lote de listas de espera de eventos, e
  processamento assíncrono de mídia (thumbnails de foto).
- Busca full-text (Postgres `tsvector` inicialmente; Elasticsearch/Meilisearch
  se o volume de posts/rodas justificar).
- Observability: OpenTelemetry + logs estruturados desde o início do
  backend, mesmo antes de haver um backend de métricas definido.
