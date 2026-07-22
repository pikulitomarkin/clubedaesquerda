# Contexto de arquitetura — Clube da Esquerda

Este documento registra **decisões** e o **porquê** delas, para que
mudanças futuras no schema (`packages/database/prisma/schema.prisma`) ou
nos serviços da API preservem as garantias descritas aqui. Onde relevante,
o schema Prisma tem comentários `DECISÃO:` apontando de volta para as
seções abaixo.

Stack: **Next.js (App Router)** no frontend, **NestJS** na API,
**PostgreSQL** como banco relacional único, **Prisma** como ORM/migrations.

---

## 1. Autenticação (CPF + senha)

### 1.1 Fluxo de cadastro

1. Cliente envia `cpf`, `senha`, `email` e dados de perfil.
2. API valida o dígito verificador do CPF (algoritmo padrão da Receita)
   tanto no client (feedback rápido) quanto no server (fonte de verdade).
3. CPF é normalizado (somente dígitos) e nunca logado em texto plano
   (nem em logs de aplicação, nem em mensagens de erro).
4. API calcula `cpfHash = HMAC-SHA256(cpfNormalizado, CPF_PEPPER)`, onde
   `CPF_PEPPER` é um segredo de aplicação guardado em secret manager
   (não no banco, não no `.env` versionado).
5. Senha é hasheada com **Argon2id** (`passwordHash`), parâmetros
   recomendados: `memoryCost=19456 (19 MiB)`, `timeCost=2`,
   `parallelism=1` (ajustar por benchmark no hardware de produção;
   ver [OWASP Password Storage Cheat Sheet]).
6. Registro é inserido em transação única. Ver §3.1 para a estratégia de
   concorrência que garante unicidade do CPF sob cadastros simultâneos.
7. Usuário nasce com `status = PENDING_VERIFICATION`; um e-mail de
   verificação é disparado de forma assíncrona (fora da transação de
   escrita, via job/queue) para não acoplar disponibilidade de e-mail à
   latência do cadastro.

### 1.2 Fluxo de login

1. Cliente envia `cpf` + `senha`.
2. API normaliza o CPF e recalcula `cpfHash` para fazer o lookup
   (`WHERE cpf_hash = $1`) — nunca se busca por CPF em texto plano.
3. Senha é verificada com `argon2.verify`. Falhas incrementam
   `failedLoginAttempts`; a partir de 5 tentativas o usuário recebe
   `lockedUntil = now() + backoff exponencial` (1min, 5min, 15min, 1h,
   24h), aplicado via NestJS `ThrottlerGuard` por IP **e** por CPF-hash
   (para impedir tanto credential stuffing distribuído quanto brute force
   contra uma conta específica).
4. Mensagens de erro são deliberadamente genéricas ("CPF ou senha
   inválidos") para não revelar se o CPF existe na base (evita
   enumeração de usuários cadastrados, sensível no contexto de uma rede
   social de orientação política).
5. Em sucesso: emite **access token JWT** (15 min, assinado com chave
   RS256 rotacionável) e um **refresh token opaco** (256 bits aleatórios),
   entregue como cookie `httpOnly`, `secure`, `sameSite=strict`.
   Só o hash SHA-256 do refresh token é persistido (`RefreshToken.tokenHash`),
   igual ao padrão de senha — o valor em texto plano nunca toca o banco.

### 1.3 Refresh e revogação

- Rotação obrigatória: cada uso de refresh token gera um novo token e
  marca o antigo como `revokedAt`, preenchendo `replacedByTokenHash`.
- **Reuse detection**: se um refresh token já revogado for apresentado
  novamente, a API revoga *toda a cadeia* de tokens daquele usuário e
  força novo login — sinal de token roubado/reaproveitado.
- Logout explícito marca o token atual como revogado; "logout de todos
  os dispositivos" revoga todos os `RefreshToken` do usuário.

### 1.4 Verificação de e-mail

O cadastro exige nome completo, data de nascimento, e-mail, cidade,
estado, CPF, senha e confirmação de senha. Fluxo:

1. `RegisterDto` valida CPF (dígito verificador), força mínima de senha
   (≥10 caracteres) e igualdade `confirmPassword === password` via
   decorator customizado (`@Match`) — a confirmação de senha é
   validação de UX/anti-erro-de-digitação, não uma medida de segurança;
   nunca é persistida.
2. Usuário é criado com `status = PENDING_VERIFICATION`,
   `emailVerified = false`.
3. Na mesma chamada (fora da transação de escrita do `INSERT` do
   usuário), a API gera um token aleatório de 256 bits, persiste
   **apenas o hash SHA-256** dele em `EmailVerificationToken`
   (mesmo padrão do `RefreshToken`, ver §1.3) com validade de 24h, e
   envia por e-mail um link `WEB_ORIGIN/verificar-email?token=<valor em
   texto plano>`.
4. Falha no envio do e-mail (provedor fora do ar) é logada mas **não**
   falha o cadastro — o registro já foi persistido com sucesso; existe
   endpoint de reenvio (`POST /auth/resend-verification`, autenticado,
   limitado a 3 tentativas por 5 minutos).
5. `POST /auth/verify-email` recebe o token em texto plano, recalcula o
   hash, localiza o registro, confere `expiresAt` e `consumedAt IS
   NULL`, marca o token como consumido e atualiza o usuário para
   `emailVerified = true`, `status = ACTIVE` — tudo em uma única
   transação (consumo do token e ativação do usuário são atômicos, para
   que um token não possa ser usado duas vezes mesmo sob requisições
   concorrentes idênticas: a segunda leitura já encontra
   `consumedAt` preenchido).
6. **Login não é bloqueado** por `emailVerified = false` — a API retorna
   `emailVerified` no corpo da resposta de login para o frontend exibir
   um aviso/banner, mas o usuário já pode navegar. Ações sensíveis
   (ex.: organizar evento presencial, iniciar chat) podem exigir e-mail
   verificado — essa é uma decisão de produto a refinar por endpoint,
   não uma restrição imposta no login em si.

### 1.5 Autorização

- `UserRole` (`MEMBER`, `MODERATOR`, `ADMIN`) controla acesso a rotas
  administrativas via `RolesGuard` do NestJS.
- Visibilidade de conteúdo (perfis, posts, rodas) é resolvida por campo
  `visibility` em cada entidade, avaliado no serviço — nunca confiado ao
  client.

---

## 2. CPF e LGPD

O CPF é tratado como **dado pessoal sensível por associação** (não está
no rol do Art. 5º, II da LGPD, mas sua exposição habilita fraude de
identidade com alto potencial de dano, ainda mais em uma plataforma que
também expõe orientação política — esta sim dado sensível nos termos da
LGPD, Art. 5º, II). A política segue **minimização de dados**:

| Campo | Conteúdo | Uso |
|---|---|---|
| `cpfHash` | HMAC-SHA256 determinístico | Lookup de login, unicidade. Irreversível. |
| `cpfEncrypted` | AES-256-GCM, envelope encryption via KMS | Só populado se exigência legal/antifraude concreta existir. Nulo por padrão. Decriptar exige papel `ADMIN` + motivo registrado em `AuditLog`. |
| `cpfLast4` | 4 últimos dígitos, texto plano | Exibição mascarada na UI (`***.***.**1-23`) para o próprio usuário confirmar qual CPF está cadastrado. |

Decisões derivadas:

- **Nunca** expor CPF completo em nenhuma resposta de API, log,
  stack trace ou mensagem de erro.
- **Nunca** aceitar CPF como parâmetro de URL/querystring (evita
  vazamento via logs de proxy/CDN); sempre no corpo da requisição.
- `AuditLog` registra qualquer acesso a `cpfEncrypted` (quem, quando,
  por quê) — condição necessária para prestar contas em uma eventual
  auditoria da ANPD.
- **Direito ao esquecimento**: exclusão de conta é *soft delete*
  (`User.deletedAt`) seguido de um job assíncrono que:
  1. Sobrescreve `email`, `cpfEncrypted`, `cpfLast4`, dados de `Profile`
     (nome, bio, foto) com valores anonimizados;
  2. Mantém `cpfHash` (para impedir re-cadastro imediato como forma de
     burlar banimento) **ou**, se o usuário exercer o direito de
     eliminação total, substitui `cpfHash` por um valor não-recuperável
     e perde a checagem de unicidade contra aquele CPF específico —
     decisão de produto/jurídico a confirmar antes do lançamento;
  3. Preserva linhas de `Message`, `Post` etc. por integridade
     referencial e para não quebrar conversas de terceiros, mas
     desassociadas de dados pessoais identificáveis do titular.
- **Retenção**: `AuditLog` e `RefreshToken` expirados são purgados por
  job periódico (ex.: 90 dias) — dado de auditoria não deve virar dado
  pessoal acumulado indefinidamente.
- **Base legal e consentimento**: `UserConsent` versiona a aceitação de
  Termos de Uso e Política de Privacidade por usuário; qualquer mudança
  material nesses documentos exige re-consentimento (nova linha, não
  update da existente, para manter histórico).
- **Dado sensível (orientação política)**: `Bandeira` (bandeiras/causas
  associadas ao perfil) é o dado mais sensível do sistema sob a LGPD.
  Visibilidade de bandeiras no perfil respeita `Profile.visibility` e,
  independente disso, nunca é usada para finalidades além do produto
  (matching, comunidades) sem novo consentimento explícito — isso
  restringe, por exemplo, o uso desse dado para ranqueamento por
  anunciantes ou compartilhamento com terceiros.

---

## 3. Concorrência: locks e transações no PostgreSQL

Todas as operações abaixo usam `Prisma.$transaction` com nível de
isolamento padrão `READ COMMITTED`, exceto onde indicado.

### 3.1 Cadastro único de CPF

**Risco**: dois requests de cadastro com o mesmo CPF chegam
simultaneamente (double-submit, retry de rede, ou tentativa deliberada
de burlar unicidade).

**Estratégia**: não usar lock explícito — a constraint
`@unique` em `User.cpfHash` já é a fonte de verdade atômica no Postgres.

```sql
INSERT INTO users (id, cpf_hash, cpf_last4, email, password_hash, ...)
VALUES ($1, $2, $3, $4, $5, ...)
ON CONFLICT (cpf_hash) DO NOTHING
RETURNING id;
```

- Se `RETURNING` não retorna linha, a API responde `409 Conflict` com
  mensagem genérica ("Não foi possível concluir o cadastro") — evita
  confirmar a um atacante que aquele CPF específico já está cadastrado
  (mesma lógica de não-enumeração do §1.2). Internamente, logamos a
  tentativa (sem o CPF em claro) para monitoramento de abuso.
- Mesmo padrão para `email` (constraint `@unique` própria).
- **Por que não `SELECT` antes de `INSERT`**: um `SELECT` seguido de
  `INSERT` fora de uma transação serializável tem race condition clássica
  (TOCTOU); empurrar a decisão de unicidade para o Postgres resolve isso
  com um índice único de forma atômica, sem lock de aplicação nem
  transação serializável cara.

### 3.1.1 SQL cru vs. API tipada — convenção de nomes de coluna

**DECISÃO**: usar a API tipada do Prisma sempre que ela expressar a
operação; SQL cru só onde o Prisma não alcança.

O motivo é concreto: o `schema.prisma` usa `@@map` nas **tabelas**
(`users`, `matches`, `confirmacoes`) mas **não** tem `@map` nos campos.
Sem `@map`, o Postgres recebe colunas com o nome do campo em camelCase e
entre aspas (`"cpfHash"`, `"confirmedCount"`). O SQL cru original, porém,
escrevia snake_case (`cpf_hash`, `confirmed_count`) — as duas convenções
não podem estar certas ao mesmo tempo, e cadastro, amizade, match e
confirmação de presença falhariam em runtime.

Como capturar `P2002` é **exatamente equivalente** a
`INSERT ... ON CONFLICT DO NOTHING` (a garantia atômica está na constraint
`@unique`, não na sintaxe), os seguintes pontos passaram para a API tipada
e deixaram de depender de nome físico de coluna:

| Onde | Antes | Agora |
|---|---|---|
| `AuthService.register` | `INSERT INTO users ... ON CONFLICT (cpf_hash)` | `user.create` + catch `P2002` |
| `FriendshipsService.add` | `INSERT INTO friendships ... ON CONFLICT (canonical_key)` | `friendship.create` + catch `P2002` |
| `MatchesService.swipe` | `INSERT INTO matches ... ON CONFLICT (user_a_id, user_b_id)` | `match.create` + catch `P2002` |

Sobraram **dois** pontos que o Prisma não expressa, ambos em
`EventsService.confirmAttendance`, e neles os identificadores estão
citados em camelCase para bater com o que o Prisma cria:

1. reserva de vaga — compara duas **colunas**
   (`"confirmedCount" < capacity`), o que o `where` do Prisma não faz;
2. revivência de confirmação cancelada — `ON CONFLICT ... DO UPDATE`
   **condicional** (`WHERE confirmacoes.status = 'CANCELLED'`), que o
   `upsert` do Prisma não expressa.

⚠️ Se um dia se optar por colunas snake_case (mais idiomático em
Postgres), a mudança é adicionar `@map` em **todos** os campos do schema
e ajustar esses dois blocos — nunca só um dos lados.

### 3.2 Match a partir de swipes recíprocos

**Risco**: usuário A curte B e usuário B curte A em janelas de tempo
muito próximas — dois workers da API podem tentar criar o mesmo `Match`
ao mesmo tempo.

**Estratégia**: normalizar o par antes de gravar.

1. Ao registrar um `Swipe` com `liked = true`, a API verifica (na mesma
   transação) se já existe um `Swipe` recíproco (`targetId = userId
   atual`, `userId = target atual`, `liked = true`).
2. Se existir, calcula `userAId = min(idA, idB)`, `userBId = max(idA,
   idB)` (comparação lexicográfica de UUID) e executa:

```sql
INSERT INTO matches (id, user_a_id, user_b_id, matched_at, status)
VALUES ($1, $2, $3, now(), 'ACTIVE')
ON CONFLICT (user_a_id, user_b_id) DO NOTHING
RETURNING id;
```

- A ordenação canônica do par é o que torna a constraint
  `@@unique([userAId, userBId])` eficaz — sem ela, `(A,B)` e `(B,A)`
  seriam linhas diferentes e o Postgres não pegaria a duplicata.
- Criação do `Chat` associado ao `Match` só ocorre se o `INSERT` do
  Match efetivamente retornou uma linha nova (evita `Chat` duplicado
  quando a segunda requisição concorrente perde a corrida do match).
- Mesmo padrão (par canônico + `ON CONFLICT DO NOTHING`) é reaplicado em
  `Friendship.canonicalKey` para pedidos de amizade.

### 3.3 Chats simultâneos (mensagens e leitura)

**Risco 1 — escrita concorrente de mensagens**: múltiplos participantes
enviando mensagens ao mesmo chat ao mesmo tempo.

- **Não há necessidade de lock**: cada `Message` é um `INSERT`
  independente; não existe estado compartilhado mutável a proteger.
  A ordenação de exibição usa `id` (ULID/UUIDv7, monotonicamente
  crescente por tempo de geração) como critério primário e `createdAt`
  como secundário — isso resolve o caso em que dois `INSERT`s concorrentes
  têm timestamps de banco muito próximos ou até idênticos (resolução de
  `now()` no Postgres é de microssegundos, mas o *commit order* sob alta
  concorrência pode não bater com a ordem "real" percebida pelos
  clientes; o ULID gerado na aplicação no momento do envio evita esse
  problema).
- Fanout em tempo real usa WebSocket (NestJS Gateway) + Redis Pub/Sub
  como *message broker* entre instâncias da API (para funcionar com mais
  de um pod atrás do load balancer); o Postgres não é usado como bus de
  eventos.

**Risco 2 — leitura concorrente (`lastReadAt`)**: cliente pode disparar
múltiplas confirmações de leitura fora de ordem (ex.: rede lenta reordena
requests).

- Update é sempre condicional e monotônico:

```sql
UPDATE chat_participants
SET last_read_at = GREATEST(last_read_at, $newReadAt),
    last_read_message_id = $newMessageId
WHERE chat_id = $chatId AND user_id = $userId
  AND (last_read_at IS NULL OR last_read_at < $newReadAt);
```

  Isso evita que uma confirmação de leitura antiga, chegando atrasada,
  "regrida" o estado de leitura já avançado por uma confirmação mais
  recente. Não precisa de transação nem lock — a cláusula `WHERE` faz o
  controle de concorrência via *compare-and-swap* implícito do próprio
  `UPDATE`.

### 3.4 Confirmação de presença em evento com capacidade limitada

**Risco**: `Evento.capacity` é finito (ex.: encontro presencial); duas
confirmações simultâneas na última vaga não podem ambas ter sucesso
(overselling), mas também não se quer serializar todas as confirmações
de um evento popular atrás de um lock de linha pesado.

**Estratégia**: contador desnormalizado (`Evento.confirmedCount`) +
update condicional atômico, na mesma transação que insere a
`Confirmacao`:

```sql
BEGIN;

-- 0. o evento precisa existir e ainda não ter encerrado. Sem esta leitura
--    prévia, o UPDATE abaixo devolveria 0 linhas tanto para "sem vaga"
--    quanto para "evento inexistente" — e o INSERT seguinte estouraria
--    violação de FK (500 em vez de 404).

-- 1. reserva a vaga de forma atômica; só avança se ainda houver capacidade
UPDATE eventos
SET confirmed_count = confirmed_count + 1
WHERE id = $eventoId
  AND (capacity IS NULL OR confirmed_count < capacity)
RETURNING confirmed_count;

-- se a linha acima não retornou nada, há evento mas não há vaga: a
-- confirmação nasce WAITLISTED, sem tocar o contador.

-- 2. grava a confirmação. O DO UPDATE ... WHERE revive quem havia
--    cancelado; se o status atual não for CANCELLED o WHERE falha, nada é
--    retornado e cai-se no conflito legítimo de double-submit.
INSERT INTO confirmacoes (id, evento_id, user_id, status, confirmed_at)
VALUES ($1, $eventoId, $userId, $status, now())
ON CONFLICT (evento_id, user_id) DO UPDATE
  SET status = EXCLUDED.status,
      confirmed_at = now(),
      cancelled_at = NULL
  WHERE confirmacoes.status = 'CANCELLED'
RETURNING id;

-- se o INSERT não retornou linha (já havia confirmação ativa), a API
-- desfaz o incremento do contador (compensação dentro da mesma
-- transação, antes do COMMIT) e responde 409.

COMMIT;
```

- Por que `UPDATE ... WHERE confirmed_count < capacity` em vez de
  `SELECT ... FOR UPDATE` na linha do evento: o `UPDATE` condicional é
  uma operação atômica única do Postgres (MVCC resolve o conflito entre
  transações concorrentes tentando incrementar a mesma linha sem lock
  explícito de aplicação) e tem melhor throughput sob contenção do que
  `SELECT FOR UPDATE` seguido de lógica em duas etapas, mantendo a
  janela de lock mínima.
- **DECISÃO: a promoção da fila de espera acontece na MESMA transação do
  cancelamento**, não em job assíncrono. A versão anterior desta seção
  previa um job — que nunca existiu: `WAITLISTED` era escrito e jamais
  lido, então quem entrava na fila ficava lá para sempre mesmo com o
  evento tendo vaga livre. Fazer na transação é atômico (não há janela em
  que a vaga fica órfã) e imediato. O promovido é o `WAITLISTED` de
  `confirmedAt` mais antigo (FIFO), e `confirmedAt` **não** é reescrito na
  promoção — ele é a ordem de chegada que ordena os "CONFIRMADÍSSIM@S".
  A promoção usa `UPDATE ... WHERE status = 'WAITLISTED'` e só incrementa
  o contador se `count === 1`: dois cancelamentos concorrentes podem ler
  o mesmo primeiro da fila, e sem esse compare-and-swap a mesma pessoa
  seria promovida duas vezes, inflando `confirmed_count`.
- **Status que ocupam vaga são `CONFIRMED` e `CHECKED_IN`.** Tratar só
  `CONFIRMED` como ocupante causava dois defeitos: cancelar alguém que já
  havia feito check-in não devolvia a vaga (`confirmed_count` subia para
  sempre), e quem fazia check-in sumia da lista de confirmados.
- **Confirmar exige evento não encerrado.** `confirmAttendance` carrega o
  evento antes de reservar e recusa se o fim efetivo já passou. Além de
  ser a regra correta de produto, isso **fecha a corrida com o
  `EventoCleanupJob` pela raiz**: se não se confirma evento encerrado e o
  job só apaga evento encerrado, os dois conjuntos deixam de se
  sobrepor. Antes, confirmar durante a exclusão devolvia 500 (violação de
  FK) ou gravava uma confirmação que a cascata apagava em seguida.
- **`UPDATE` que devolve 0 linhas não significa "sem vaga".** Também
  significa "evento não existe". Por isso a existência é checada antes:
  senão, confirmar presença num id inexistente virava 500 em vez de 404.
- A revivência de cancelamento é feita com
  `ON CONFLICT (evento_id, user_id) DO UPDATE ... WHERE
  confirmacoes.status = 'CANCELLED'`. Com o `DO NOTHING` anterior, a linha
  `CANCELLED` remanescente fazia o `INSERT` conflitar e a pessoa recebia
  "Presença já confirmada" — mensagem errada (ela havia cancelado) e
  bloqueio permanente para voltar. Quando o status atual não é
  `CANCELLED`, o `WHERE` falha, nada é retornado e cai-se no conflito
  legítimo de double-submit.
- `@@unique([eventoId, userId])` em `Confirmacao` é a rede de segurança
  final contra double-submit do mesmo usuário, independente do controle
  de capacidade.

### 3.5 Convites

- `Convite` tem `@@unique([eventoId, inviteeId])` — reenvio do mesmo
  convite é idempotente via `ON CONFLICT (evento_id, invitee_id) DO
  UPDATE SET ...` (atualiza `expiresAt`/`status` em vez de duplicar).
- Aceitar um convite (`Convite.status = ACCEPTED`) e criar a
  `Confirmacao` correspondente acontece na mesma transação que o
  incremento de `confirmedCount` descrito em §3.4 — um convite aceito
  consome vaga como qualquer outra confirmação.

---

## 4. Por que Postgres único para dados, Redis só para pub/sub

Para a arquitetura inicial, deliberadamente **não** introduzimos Redis
como armazenamento de dados nem uma fila de mensageria dedicada. Todas
as garantias de concorrência das seções acima são resolvidas com
primitivas nativas do Postgres (constraints únicas, `ON CONFLICT`,
updates condicionais). Redis é usado exclusivamente como *pub/sub* de
transporte para o fanout de eventos em tempo real entre instâncias da
API (§5) — ele não guarda nenhum dado que não possa ser reconstruído a
partir do Postgres; se o Redis cair, a API continua servindo REST
normalmente, só a entrega *em tempo real* (popups, mensagens ao vivo)
é degradada. Introduzir cache de leitura (perfis, contadores de feed) e
uma fila real (ex.: BullMQ, para envio de e-mail e promoção de waitlist
em lote) fica como evolução natural quando houver métricas de carga que
justifiquem — ver `docs/architecture.md`.

---

## 5. Entrega em tempo real (RealtimeGateway)

Um único WebSocket (`RealtimeGateway`, path `/ws`) atende toda a API —
chat ao vivo, popup de match e (implicitamente) qualquer notificação
futura — em vez de um gateway por feature. Motivação: cada gateway em
`ws` bruto reimplementa autenticação de conexão e registro de sockets;
concentrar isso em um lugar evita duplicar essa lógica e evita que o
cliente precise manter múltiplas conexões WS abertas.

- **Autenticação da conexão**: o browser não permite headers
  customizados em handshakes WebSocket, então o access token JWT viaja
  na query string (`wss://api/ws?token=...`). `handleConnection` verifica
  o token com a mesma chave pública RS256 do REST (`JwtConfigModule`,
  compartilhado com `AuthModule` — ver §1) e fecha a conexão
  (`code 4001`) se inválido.
- **Registro local**: cada instância do processo mantém
  `Map<userId, Set<WebSocket>>` dos sockets conectados nela. Isso
  permite `notifyUsers(userIds, event, payload)` sem precisar de uma
  tabela no Postgres — o estado de "quem está online e em qual conexão"
  é inerentemente efêmero e não precisa sobreviver a um restart.
- **Fanout entre instâncias**: com mais de um pod/processo atrás do load
  balancer, o usuário A pode estar conectado na instância 1 e o usuário
  B na instância 2. `notifyUsers` publica `{userIds, event, payload}` no
  canal Redis `realtime:events`; toda instância está inscrita e entrega
  **localmente** apenas aos `userIds` que tem conectados. Isso é
  deliberadamente diferente de um `server.emit()` (broadcast para todo
  mundo): eventos como `match:created` são privados aos dois usuários
  do match, e um broadcast global vazaria esse popup para qualquer
  usuário conectado.
- **Por que não Socket.IO**: o projeto já usa `ws` (mais leve, sem
  protocolo proprietário por cima do WebSocket) — o registro manual de
  "salas por usuário" substitui o conceito de *rooms* do Socket.IO com
  poucas linhas, sem trazer a dependência adicional.
- **Consumidores**: `MatchesService` (evento `match:created`, após
  reciprocidade de swipes — ver §3.2) e `FriendshipsService` (evento
  `friendship:created`, ao adicionar — ver §6) injetam `RealtimeGateway`
  diretamente (módulo `@Global()`, não precisa ser importado). O envio
  de mensagem de chat via WebSocket (`send_message`) já acontece dentro
  do próprio `RealtimeGateway`, que亦 conhece os participantes do chat
  para notificar só eles. O envio via REST (`POST /chats/messages`) é um
  fallback que **não** empurra tempo real — existe para clientes sem
  WS ativo; a mensagem aparece no próximo `GET`.

## 6. Amizade, bloqueio e chat

**Botão "ADICIONAR"** não abre um fluxo de pedido/aceite — cria amizade
mútua imediatamente (`Friendship.status = ACCEPTED` já na criação) e
garante acesso a um chat direto entre os dois usuários
(`ChatsService.getOrCreateDirectChat`, reutilizado também pelo Match, ver
§3.2). Motivo: o produto pede "adicionar cria amizade mútua e inclui no
chat" como uma ação única e imediata, não uma solicitação assíncrona —
diferente de redes sociais que modelam amizade como pedido pendente. A
tabela `Friendship` mantém o campo `status` (e o enum ainda tem
`PENDING`/`DECLINED`/`CANCELLED`) para não fechar a porta a um fluxo de
pedido explícito no futuro, mas o serviço atual só produz `ACCEPTED`.

- Idempotência: clique duplo em "ADICIONAR" não duplica nada —
  `INSERT ... ON CONFLICT (canonical_key) DO NOTHING` (mesmo padrão de
  par canônico do Match, §3.2) e `getOrCreateDirectChat` são ambos
  seguros de chamar de novo.
- **Botão "BLOQUEAR"**: (1) cria um `Block`, (2) apaga a `Friendship`
  entre as partes (`DELETE ... WHERE canonical_key = ...`), (3) encerra
  um `Match` ativo entre elas, se existir — bloquear alguém com quem
  houve match não pode deixar o chat daquele match acessível. As três
  operações rodam na mesma transação. O usuário bloqueado **não** é
  notificado — bloqueio é uma ação silenciosa (norma comum de produto:
  avisar quem foi bloqueado incentivaria retaliação/assédio).
- **Invisibilidade mútua**: `UsersService.findById` checa `Block` nos
  dois sentidos (`blockerId = viewer OU blockerId = alvo`) e responde
  `404` — não `403` — se houver bloqueio em qualquer direção. Usar 404
  em vez de 403 evita confirmar ao bloqueado "esse perfil existe mas
  você não pode vê-lo"; do ponto de vista dele, a conta simplesmente não
  existe. Mensagens e histórico de chat entre as partes **não** são
  apagados (auditabilidade/moderação), só o acesso a novos recursos via
  perfil fica bloqueado — chats antigos continuam existindo no banco,
  mas nenhuma tela nova os expõe.

### 6.1 Escopo do bloqueio: ocultação mútua total

**DECISÃO**: o bloqueio é de **ocultação mútua total**, não apenas de
interação 1:1. Bloqueador e bloqueado deixam de ver conteúdo e presença
um do outro em **todas** as superfícies, inclusive espaços públicos
compartilhados dos quais ambos participam.

A alternativa considerada era restringir só a interação direta (perfil,
chat, match, amizade) e manter o conteúdo visível em espaços públicos —
padrão de várias redes sociais. Foi descartada porque aqui o espaço
compartilhado (uma roda) é justamente onde o assédio dirigido acontece:
ver os posts de quem você bloqueou, ou ter suas reações visíveis para
ele, esvazia o bloqueio na prática.

A primitiva é `BlocksService` (`modules/common/blocks`), módulo `@Global`
como o `PrismaModule` por ser preocupação transversal:

- `getHiddenUserIds(viewerId?)` devolve os ids com bloqueio em qualquer
  direção com o viewer, para uso como `notIn` nos filtros de leitura.
  Com lista vazia, `notIn: []` é no-op no Prisma — o chamador não precisa
  ramificar. Viewer anônimo devolve `[]` (não tem bloqueios).
- `isBlocked(a, b)` para barrar **escritas** (ex.: reagir a conteúdo de
  quem te bloqueou).

Superfícies cobertas:

| Superfície | Efeito |
|---|---|
| `PostsService.listByRoda` | posts de bloqueados somem; reações deles não entram na contagem (`_count` filtrado) |
| `ChatsService.listMessages` | mensagens de bloqueados somem no chat `GROUP` de roda (chats `DIRECT` já ficam inteiramente inacessíveis, §9.4) |
| `RodasService.findBySlug` | membros bloqueados somem da lista de participantes |
| `HomenagensService.listForProfile` | homenagens escritas por bloqueados somem — inclusive para o dono do perfil |
| `ReactionsService.react` | reagir a conteúdo de bloqueado responde `403` com mensagem genérica |
| `UsersService.findById` | `404` (já descrito acima) |

Rotas públicas que precisam identificar o viewer para aplicar o filtro
(feed de posts da roda, página da roda) usam `OptionalJwtAuthGuard`:
autentica se houver token válido, mas **não** rejeita quando não há —
mantém a rota pública sem perder a filtragem para quem está logado.

O bloqueio continua **silencioso** em todas elas: nada na resposta revela
que existe um bloqueio; o conteúdo simplesmente não existe do ponto de
vista do bloqueado. Por isso `ReactionsService` responde "Conteúdo
indisponível", e não "você foi bloqueado".

Custo aceito: cada listagem filtrada faz uma consulta extra a `blocks`
por request. Se virar gargalo, o caminho é cachear `getHiddenUserIds` por
usuário (invalidando em block/unblock), não remover o filtro.

## 7. Homenagens

Homenagens (recados públicos entre amigos, até 200 caracteres) só podem
ser criadas quando `FriendshipsService.isMutualFriend` confirma
`Friendship.status = ACCEPTED` entre autor e destinatário — checado no
serviço, não como constraint de banco, porque a amizade pode terminar
depois sem que isso deva apagar homenagens já publicadas (o texto vira
um artefato histórico do perfil, não uma relação viva).

- `visible` é controlada **exclusivamente pelo destinatário**
  (`HomenagensService.setVisibility` valida `homenagem.recipientId ===
  recipientId` do chamador) — o autor não pode ocultar a própria
  homenagem depois de publicada, e ninguém além do destinatário pode
  decidir o que aparece no mural dele.
- Listagem (`GET /users/:userId/homenagens`) mostra só `visible = true`
  para qualquer visitante; o dono do perfil vê todas (inclusive ocultas)
  para poder gerenciá-las.

## 8. Denúncia de perfil e fila de moderação

Categorias são um **enum fixo** (`ReportCategory`: `OFENSIVO`,
`RACISMO`, `LGBTFOBIA`, `MISOGINIA`, `DESRESPEITO_REGRAS`) — não texto
livre — para que a fila de moderação possa triar e medir por categoria
sem depender de NLP sobre texto arbitrário.

- Toda denúncia nasce `status = PENDING`; só `ADMIN`/`MODERATOR`
  (`RolesGuard`) pode listar a fila (`GET /reports`) ou resolver
  (`PATCH /reports/:id` → `IN_REVIEW`/`RESOLVED`/`DISMISSED`), com o
  revisor e o horário registrados (`reviewedById`, `reviewedAt`).
- **DECISÃO: dois regimes de upload, público e privado** (upload.constants).
  O diretório `uploads/` tem dois subdiretórios com acesso distinto:
  - `uploads/public/` — mídia que aparece no produto (foto de perfil, capa
    de roda, imagem de post). Servida por `/uploads/<arquivo>`
    (`useStaticAssets` aponta para `public/`), com `Content-Disposition:
    attachment` + `nosniff`. `POST /uploads` grava aqui e devolve a URL
    absoluta usada em `Roda.imageUrl`, `Post.mediaUrls` etc.
  - `uploads/evidence/` — anexos de denúncia. **Nunca** servidos
    estaticamente (ficam FORA do diretório público). `POST /reports/evidence`
    grava aqui e devolve uma **referência opaca** (`UUID.ext`), não uma URL.
    A referência vai em `CreateReportDto.evidenceRefs` (validado por regex
    `UUID.ext`, sem barras/`..`) e é guardada em `Report.evidenceUrls` (nome
    de coluna herdado; agora contém refs, não URLs).
- **Leitura de evidência**: só por `GET /reports/:id/evidence/:index`,
  restrita a `ADMIN`/`MODERATOR` (`RolesGuard`), que faz *stream* do arquivo
  e grava **`AuditLog`** (`report.evidence.view`, com ator/índice/ref) — a
  prestação de contas de acesso a dado sensível que a LGPD (art. 37) exige.
  Por que isto existe: antes, a evidência (print de assédio de pessoa real)
  ia para o mesmo diretório público das fotos de perfil e ficava legível por
  qualquer um com a URL. Este era o furo **C3** da auditoria de segurança.
- **Object storage (S3/GCS) segue adiado** de propósito: sem credenciais de
  bucket nesta fase. `StorageService` já isola a remoção de arquivos, e o
  `multer` está por trás de `uploadInterceptorOptions`, então trocar disco
  local por um adapter é uma mudança contida quando rodar em mais de uma
  instância (onde disco por processo deixa de servir).
- **Ainda aberto (defesa em profundidade, não bloqueia lançamento)**: a
  mídia de `uploads/public/` continua legível por link direto — semipública
  por natureza (aparece no feed). A evolução planejada é **URL assinada
  (HMAC + TTL, assinada na leitura)**, que exige percorrer os ~8 caminhos de
  leitura que devolvem `photoUrl`/`imageUrl`/`mediaUrl(s)` e ajustar o
  contrato do frontend — feito como passo separado.
- Denunciar não exige que os perfis não estejam bloqueados entre si —
  ao contrário de amizade/chat, um usuário deve poder denunciar alguém
  que já bloqueou (ou que o bloqueou).

---

## 9. Chat: mensagens, Roda de Conversa e retenção pós-bloqueio

### 9.1 Mensagens: links, GIFs e emojis personalizados

Deliberadamente **sem upload de foto/vídeo no chat** — `SendMessageDto`
só aceita `type` `TEXT` ou `GIF` (`@IsIn(["TEXT", "GIF"])`), mesmo o
enum `MessageType` do banco tendo `IMAGE`/`AUDIO` para uso futuro/outros
fluxos. Isso é decisão de produto (evitar chat virar canal de
compartilhamento de mídia arbitrária), não limitação técnica.

- **Links**: nenhum tratamento no backend — `content` é texto livre
  (até 4000 caracteres). Detecção e renderização de URL como link
  clicável é 100% client-side (regex de linkify no componente de
  mensagem), para não acoplar o schema a uma lógica de parsing que pode
  mudar de gosto na UI sem precisar de migration.
- **GIFs**: nunca upload — vêm de busca (`GET /gifs/search`, proxy para
  o Tenor) e a mensagem guarda `mediaUrl` apontando para a URL do GIF no
  provedor. A chave do provedor (`TENOR_API_KEY`) fica **só no
  backend**; o client nunca a recebe, só chama o proxy e recebe
  resultados já resolvidos. Sem chave configurada, a busca retorna lista
  vazia — a feature de GIF fica indisponível, mas não derruba o resto do
  chat (mesmo princípio de degradação graciosa do SMTP, §1.4).
  `mediaUrl` é validado como URL absoluta https (`IsUrl`) — não aceita
  caminho de `/uploads`, que é reservado a outros fluxos.
- **Emojis personalizados**: catálogo curado (`CustomEmoji`, model
  próprio — não texto livre), administrado por `ADMIN`/`MODERATOR` via
  `POST /emojis` (a imagem do emoji em si passa por `POST /uploads`,
  como ícone de catálogo — não é "mídia de mensagem", é asset da
  plataforma, por isso não conflita com a proibição de upload em
  mensagens). Emojis são digitados como `:shortcode:` dentro de uma
  mensagem `TEXT` comum; a substituição por `<img>` é responsabilidade
  do client, que casa os shortcodes do texto contra `GET /emojis`
  (catálogo ativo). Emojis unicode padrão (😀, 👍 etc.) não passam pelo
  backend em nenhum momento — são só caracteres Unicode dentro de
  `content`, renderizados nativamente pelo SO/browser.

### 9.2 Até 2 abas de chat abertas simultaneamente

Restrição **só de client** — a API não impõe limite de chats abertos
(`GET /chats` lista todos, sem paginação artificial por "abas"). O
frontend mantém uma pilha de no máximo 2 conversas abertas
(`ChatDockProvider`, ver `apps/web/src/lib/chat-dock-context.tsx`);
abrir uma terceira fecha a menos recentemente focada. Não há
enforcement no backend porque não há nada ali para proteger — é uma
escolha de densidade de UI (janelas flutuantes estilo Messenger), não
uma questão de segurança ou de carga no servidor. A conexão WebSocket
em si é única por sessão (`RealtimeGateway`, §5) e independe de quantas
abas estão visíveis: todas as mensagens de todos os chats do usuário
chegam por ela, a UI só decide o que mostrar.

### 9.3 Roda de Conversa: "SAIR" vs. "FECHAR RODA"

- **"SAIR"** (`DELETE /rodas/:id/membros/me`): remove o `RodaMembro` e o
  `ChatParticipant` do usuário. Bloqueado para quem tem `role = OWNER`
  (`RodasService.leave` lança `ForbiddenException`) — uma roda sem dono
  cria ambiguidade sobre quem pode administrá-la (fechar, moderar
  membros); o criador só sai encerrando a roda inteira.
- **"FECHAR RODA"** (`DELETE /rodas/:id`): permitido ao `OWNER` da roda
  **e** a `ADMIN`/`MODERATOR` da plataforma. Antes só o OWNER podia
  fechar, o que deixava duas situações sem saída: não havia caminho para
  moderar uma roda abusiva, e uma roda cujo dono fosse banido ficava
  permanentemente órfã (o dono não pode sair, §9.3, e ninguém mais podia
  fechar).
- **DECISÃO: fechar é arquivar, não apagar.** `close()` grava
  `Roda.archivedAt` (`UPDATE ... WHERE archivedAt IS NULL`, condicional,
  para que dois cliques simultâneos virem 404 em vez de erro) e marca
  `Chat.purgeAt = now() + 48h` no chat da roda. O `DELETE` definitivo —
  com o cascade do schema (`Roda → Chat → {ChatParticipant, Message}`,
  `Roda → RodaMembro`, `Roda → Mesa`, `Roda → Post`) — só roda 48h
  depois, no `ChatRetentionJob`.
  O delete imediato anterior permitia que o dono de uma roda destruísse
  instantaneamente todas as mensagens e posts dela — inclusive a
  evidência de assédio ocorrido ali — sem nenhuma janela de moderação, o
  oposto da retenção já adotada no bloqueio (§9.4). O campo `archivedAt`,
  que existia no schema sem uso, passa a ser a fonte de verdade desse
  estado.
- Efeito imediato do arquivamento (sem esperar o expurgo): o chat some do
  inbox (`listMyChats` filtra `purgeAt IS NULL`), `assertAccess` nega
  acesso a chat com `purgeAt` preenchido, `PostsService.listByRoda`
  filtra `roda.archivedAt IS NULL` e `findBySlug`/`join` respondem 404.
- `Roda → Evento` é a exceção do cascade (`onDelete: SetNull`) — eventos
  já publicados não são "dados do chat" e sobrevivem ao fechamento da
  roda, só perdem a referência a ela.

### 9.3.1 Visibilidade da roda em `join`/`findBySlug`

**DECISÃO**: `RodaVisibility` é aplicada no serviço, não só na UI.
Antes, `join()` fazia o `upsert` do `RodaMembro` sem consultar
`visibility` — e como o join também insere um `ChatParticipant`, qualquer
usuário autenticado entrava numa roda `INVITE_ONLY` via
`POST /rodas/:id/membros` e passava a ler todo o histórico do chat
privado dela.

| Visibilidade | Quem vê / entra |
|---|---|
| `PUBLIC` | qualquer um, inclusive anônimo |
| `MEMBERS_ONLY` | qualquer usuário autenticado (a rota já exige JWT) |
| `INVITE_ONLY` | apenas quem já é `RodaMembro` |

Quem não passa recebe **404**, não 403 — mesma política do bloqueio
(§6): não confirmamos a existência de uma roda que o viewer não pode ver.
- Membros com sessão WebSocket ativa recebem o evento realtime
  `roda:closed` (`{rodaId, chatId}`, ver §5) assim que a roda fecha, para
  que o client feche a aba daquele chat imediatamente em vez de deixar
  uma aba "morta" apontando para um chat que não existe mais.

### 9.4 Retenção de 48h após bloqueio

Quando `FriendshipsService.block()` roda, **dois efeitos distintos e
independentes** acontecem sobre o(s) chat(s) `DIRECT` entre as partes
(pode haver mais de um — um nascido de Match e outro de "ADICIONAR",
já que `getOrCreateDirectChat` não reaproveita o chat de um Match):

1. **Acesso é cortado na hora**: `ChatsService.assertAccess` já nega
   `sendMessage`/`listMessages` a qualquer chat `DIRECT` onde exista um
   `Block` em qualquer direção entre os dois participantes (ver §6) —
   isso independe de o expurgo já ter rodado ou não.
2. **Dados são retidos por 48h e só então apagados**:
   `ChatsService.scheduleChatPurge` marca `Chat.purgeAt = now() + 48h`
   em todos os chats `DIRECT` do par. `ChatRetentionJob`
   (`@Cron(EVERY_10_MINUTES)`) apaga (`DELETE`, cascata para
   `ChatParticipant`/`Message`) qualquer chat com `purgeAt` vencido.

Por que reter em vez de apagar na hora: dá uma janela para que uma
denúncia relacionada ao bloqueio (§8) ainda tenha o histórico da
conversa disponível para moderação, sem manter esse histórico
indefinidamente — 48h é o equilíbrio adotado. Se o bloqueio for desfeito
antes do expurgo rodar, `FriendshipsService.unblock()` chama
`ChatsService.cancelChatPurge` (`purgeAt = null`) e o histórico volta a
ficar acessível normalmente.

Quatro garantias que o expurgo precisa cumprir, e como:

- **Desbloqueio sob bloqueio mútuo não cancela a retenção.** `unblock()`
  remove apenas o próprio `Block`, então só chama `cancelChatPurge` se
  `isBlocked()` confirmar que não restou bloqueio em nenhuma direção.
  Sem essa checagem, A desbloquear B enquanto B ainda bloqueia A zerava
  o `purgeAt` de um chat que continuava inacessível — ele nunca mais
  seria expurgado e a garantia de 48h falhava em silêncio.
- **Denúncia aberta suspende o expurgo.** O job pula chats cujos
  participantes tenham `Report` em `PENDING`/`IN_REVIEW`. Apagar o
  histórico com o caso ainda na fila destruiria exatamente a evidência
  que a janela existe para preservar (uma denúncia feita na hora 47
  perdia a conversa na hora 48).
- **Arquivos são apagados junto com as linhas.** `StorageService`
  remove do disco o que `Message.mediaUrl`, `Post.mediaUrls` e
  `Roda.imageUrl` referenciam, antes do `DELETE`. Sem isso, o expurgo
  apagava o registro mas deixava o arquivo órfão em `./uploads` —
  servido estaticamente e **sem autenticação**, ou seja, a mídia
  continuava acessível na mesma URL para sempre.
- **Só uma instância expurga por vez.** `@Cron` dispara em todos os pods;
  o job toma um `pg_try_advisory_lock` e as demais instâncias saem na
  hora. Também há `try/catch` com log (falha silenciosa deixaria a
  retenção de ser cumprida sem alarme) e processamento em lotes de 100
  (evita um `DELETE` cascateado gigante travando tabelas).

O mesmo job faz o expurgo definitivo das rodas arquivadas há mais de 48h
(§9.3), reaproveitando a mesma janela e o mesmo `CHAT_PURGE_RETENTION_MS`.

---

## 10. Eventos: únicos, recorrentes/permanentes, convites

### 10.1 Eventos "únicos" vs. "recorrentes"/"permanentes"

Um único campo par governa a natureza do evento — sem enum redundante
de "tipo de recorrência":

- `Evento.recurrenceFrequency` (`SEMANAL` | `QUINZENAL` | `MENSAL`) —
  `NULL` = evento **único**.
- `Evento.recurrenceUntil` — só relevante quando `recurrenceFrequency`
  está preenchido. `NULL` = evento **permanente** (recorre sem data de
  término definida, ex.: uma Roda de Conversa semanal contínua);
  preenchido = evento **recorrente** com fim definido pelo organizador.

Eventos únicos são os únicos sujeitos a exclusão automática
(`EventoCleanupJob`, §10.2) — recorrentes e permanentes persistem
indefinidamente, é o organizador quem decide encerrá-los (não há hoje um
endpoint de "encerrar evento recorrente"; ficou fora do escopo desta
etapa, mas a distinção no schema já comporta essa evolução sem
migration adicional).

**Simplificação deliberada**: o schema modela a *série* recorrente como
uma única linha `Evento` (como o evento-mestre do Google Calendar), não
materializa uma linha por ocorrência futura. `startsAt`/`endsAt`
ancoram a primeira ocorrência; confirmações e convites valem para a
série como um todo, não por ocorrência individual. Expandir ocorrências
futuras (para um calendário, por exemplo) é um projeto à parte —
calcular `próxima_ocorrência = startsAt + N * intervalo` a partir de
`recurrenceFrequency` é suficiente para os requisitos atuais (persistir
a regra definida pelo organizador) sem essa complexidade adicional.

### 10.2 Exclusão automática de eventos únicos (`EventoCleanupJob`)

Mesmo padrão de `ChatRetentionJob` (§9.4): `@Cron(EVERY_10_MINUTES)` +
`pg_try_advisory_lock` (só uma instância expurga por vez, entre todos os
pods) + lote de 100 por execução (evita `DELETE` cascateado gigante).
Critério: `recurrenceFrequency IS NULL AND COALESCE(endsAt, startsAt) <
now() - 1h`.

**Por que "− 1h" e não "no instante exato do término"**: essa janela é
a MESMA usada por `EventsService.listForUser` (§10.4) para decidir até
quando um evento aparece no perfil do convidado
(`EVENTO_POST_END_GRACE_MS`, constante única compartilhada pelos dois
lados). Se a exclusão apagasse o evento no instante exato do término, a
promessa de "evento visível no perfil até 1h após o término" seria
quebrada pela própria exclusão automática — as duas regras precisam
usar exatamente o mesmo corte, por isso vivem da mesma constante em vez
de dois números mágicos que poderiam divergir com o tempo.

Eventos não têm hoje um campo de mídia própria (diferente de
`Roda.imageUrl`), então este job não chama `StorageService` — não há
arquivo em `./uploads` para órfãos aqui. Cascata do schema
(`Evento → Mesa/Convite/Confirmacao`) cuida do resto.

### 10.3 Persistência de eventos recorrentes/permanentes

Não há job nenhum tocando eventos com `recurrenceFrequency` preenchido —
a ausência de lógica é a decisão: eles simplesmente nunca entram no
critério de exclusão do §10.2, então persistem por padrão. Isso também
significa que confirmações/convites de um evento recorrente não
"resetam" ao longo do tempo — é uma limitação conhecida da simplificação
de §10.1 (sem materialização por ocorrência, não há como um convite
valer só para a ocorrência de uma semana específica).

### 10.4 Sistema de convites

- **Quem pode convidar**: organizador, ou qualquer pessoa com
  `Confirmacao.status = CONFIRMED` para aquele evento
  (`EventsService.assertCanInvite`). Fora isso, `403` — sem essa
  checagem, qualquer usuário autenticado convidaria pessoas para um
  evento com o qual não tem nenhuma relação.
- **Múltiplos convites para a mesma pessoa são permitidos de
  propósito**: `Convite` não tem `@@unique([eventoId, inviteeId])` (foi
  removido deliberadamente — ver comentário no schema). Motivação: dois
  amigos diferentes podem querer convidar a mesma pessoa para o mesmo
  evento, ou alguém pode reforçar um convite não respondido — nenhum
  dos dois casos é um erro do usuário que justifique um `409`.
- **Popup de confirmação/recusa**: ao criar um `Convite`,
  `RealtimeGateway.notifyUsers([inviteeId], "convite:recebido", {...})`
  entrega o evento em tempo real (mesmo mecanismo de `match:created`,
  §5); se o convidado não estiver conectado no momento,
  `GET /convites/pendentes` (chamado ao carregar o app) cobre o mesmo
  caso ao reconectar. `POST /convites/:id/resposta` (`{accept:
  boolean}`) é o botão confirmar/recusar do popup.
- **Aceitar resolve todos os convites pendentes daquele par**: como o
  mesmo (evento, convidado) pode ter vários `Convite` `PENDING` ao
  mesmo tempo, aceitar UM marca todos os outros como `ACCEPTED` também
  (`EventsService.respondInvite`) — não faz sentido o popup continuar
  perguntando sobre algo que a pessoa já confirmou por outra via.
  Recusar só afeta o convite específico clicado (um convite recusado
  não fecha a porta a outro convite do mesmo evento vindo de outra
  pessoa).
- **Aceitar reaproveita `confirmAttendance`** (§3.4) — mesma transação
  atômica de capacidade/waitlist; um convite aceito consome vaga como
  qualquer confirmação direta. Se a pessoa já estava confirmada por
  outra via (corrida entre dois convites aceitos ao mesmo tempo), o
  `ConflictException` de confirmação duplicada é engolido nesse fluxo
  especificamente — do ponto de vista de "responder este convite", já
  estar confirmado não é uma falha.
- **"CONFIRMADÍSSIM@S" em tempo real**: toda vez que uma confirmação
  nova é criada (direta via `POST /eventos/:id/confirmacoes` ou via
  convite aceito), `notifyConfirmacoesAtualizadas` notifica organizador
  + todos os já confirmados (não todo mundo conectado — são as pessoas
  com razão de estar de olho naquele evento específico) com
  `evento:confirmacoes_atualizadas`, para a lista atualizar sem precisar
  de F5.

### 10.5 Evento no perfil do convidado até 1h após o término

`GET /users/:userId/eventos` (`EventsService.listForUser`) retorna
eventos onde o usuário é organizador, tem confirmação `CONFIRMED`, ou
convite `ACCEPTED` — filtrados por `COALESCE(endsAt, startsAt) >= now()
- 1h`, a mesma `EVENTO_POST_END_GRACE_MS` do §10.2. Convite `PENDING`
ou `DECLINED` não aparece aqui (só depois de aceito o evento passa a
"pertencer" ao perfil do convidado); convites pendentes vivem em
`GET /convites/pendentes` (§10.4), uma lista separada.

---

## 11. Entrada na Roda, posts nas Mesas, reações

### 11.1 "ENTRAR NA RODA" e imagem no perfil

`RodasService.join` já existia (upsert em `RodaMembro` + inclusão no
`ChatParticipant` do chat da roda, respeitando `Roda.visibility` — ver
§9.3). O que faltava era o outro lado: `GET /users/:userId/rodas`
(`RodasService.listForUser`) devolve as rodas de que o usuário é membro
— cada uma já com `imageUrl` — para o client renderizar a imagem da
roda no perfil sem uma segunda chamada por roda. Filtra
`archivedAt: null` (uma roda fechada, mesmo ainda não expurgada
definitivamente — janela de 48h do §9.3 — some do perfil na hora).

Essa rota não reaplica a checagem de bloqueio (`BlocksService`): quem
chega até ela já passou pelo `404` de `UsersService.findById` se
houvesse bloqueio entre o viewer e o dono do perfil — checar de novo
aqui seria uma segunda validação da mesma coisa, não uma proteção a
mais.

### 11.2 Posts nas Mesas

`Post.mesaId` (novo, opcional, independente de `rodaId`) referencia uma
`Mesa` — `PostsService.listByMesa` espelha `listByRoda` (mesmo formato
de paginação por cursor, mesma ocultação de bloqueados via
`BlocksService`). Os dois campos são independentes de propósito: um
post numa mesa não precisa repetir o `rodaId` da roda-mãe da mesa
(a mesa já carrega essa relação).

**"Sempre vinculados ao autor (nunca anônimos)"**: isso já era garantido
no schema — `Post.authorId` nunca foi nulo. O que mudou aqui é que
`listByRoda`/`listByMesa` agora **sempre incluem o autor** na resposta
(`author: { id, profile: { displayName, photoUrl } }`) — antes a query
só trazia `_count` de reações. Sem isso, o client não tinha como montar
o link direto para o perfil sem uma request extra por post; a garantia
de "nunca anônimo" só é útil na prática se o dado do autor já vem
resolvido.

### 11.3 Sistema de reações

Cinco reações fixas — `ReactionType`: `UAU`, `FERA`, `EITA`, `NOPS`,
`PERAI` (rótulo exibido "PERAÍ"; identificador do enum em ASCII, acento
só no comentário/label da UI) — substituindo o conjunto anterior
(`APOIO`/`CONCORDO`/`FORCA`/`SOLIDARIEDADE`/`RISO`), que não tinha
nenhum uso fora do próprio enum (nenhum dado em produção para migrar).

- **Uma reação por usuário por post**: já garantido pela constraint
  `@@unique([userId, targetType, targetId])` (ver comentário no schema)
  — trocar de reação é um `UPDATE` via `upsert` (`ReactionsService.react`),
  nunca uma segunda linha. Reagir ao conteúdo de alguém que bloqueou (ou
  foi bloqueado por) o usuário é barrado com mensagem genérica ("Conteúdo
  indisponível"), mesma política de ocultação mútua total do resto do app.
- **Contagem numérica**: em vez de só o total (`_count` antigo),
  `PostsService.attachReactionSummary` roda um `groupBy(by: [targetId,
  type])` sobre os posts da página e devolve `reactionCounts: {UAU?: n,
  FERA?: n, ...}` por post — a UI mostra o número ao lado de cada um dos
  5 botões, não um total agregado sem discriminar o tipo. Reações de
  usuários bloqueados (pelo viewer) são excluídas da contagem
  (`userId: { notIn: hidden }`), consistente com a ocultação mútua total.
- **Reação do próprio viewer**: a mesma função devolve `viewerReaction`
  (o tipo que o usuário logado já deu, ou `null`) para a UI destacar o
  botão ativo sem precisar cruzar a lista de reações no client.
- **Custo**: duas queries extra por página de posts (agrupamento +
  reações do viewer), não uma por post — o custo é fixo por página,
  não escala com a paginação em si.

---

## 12. Build real e edição de perfil

O schema nunca tinha sido validado com `prisma generate` até este ponto
(ambiente sem `pnpm`/`node_modules` nas etapas anteriores). Rodar
`pnpm install` + `prisma generate` + `tsc --noEmit`/`next build` pela
primeira vez revelou alguns bugs reais, agora corrigidos:

- **`User.profileBandeiras`/`profileInteresses` estavam no model
  errado.** `ProfileBandeira.profile`/`ProfileInteresse.profile`
  sempre apontaram para `Profile` (não para `User`), mas a relação
  inversa tinha sido declarada em `User`. Prisma exige que toda relação
  tenha os dois lados no mesmo par de models — o `generate` falhava.
  Movido para `Profile`, onde pertence.
- **`next.config.ts` não é suportado no Next 14** (só a partir do 15) —
  convertido para `next.config.mjs`.
- **`useSearchParams()` em `/verificar-email` precisa de um
  `<Suspense>`** para não quebrar a geração estática — o conteúdo que
  usa o hook foi isolado num componente filho envolto em `Suspense`.
- Vários `Object is possibly 'undefined'` sob `noUncheckedIndexedAccess`
  (ver `tsconfig.base.json`): principalmente o padrão
  `const [a, b] = [x, y].sort()`, usado em vários lugares para ordenar
  um par de ids canonicamente — cada elemento de um array ordenado é
  tipado `T | undefined` sob essa flag, mesmo sabendo que há
  exatamente 2. Centralizado num helper (`sortPair`, em
  `modules/common/utils/sort-pair.ts`) em vez de repetir a asserção em
  cada arquivo.
- `apps/api` tinha `declaration: true` herdado de `tsconfig.base.json`
  (pensado para os `packages/*`, consumidos por outros pacotes do
  monorepo) — numa aplicação-folha isso faz o `tsc` tentar nomear tipos
  do Prisma que vivem num caminho não-portável dentro do
  `node_modules` aninhado do pnpm (`TS2742`). Desligado só em
  `apps/api/tsconfig.json`.

**Edição de perfil**: `Profile.photoUrl` podia ser lido mas não
atualizado — `UpdateProfileDto`/`ProfilesService.update` não aceitavam
o campo. Adicionado (`photoUrl`, validado como URL absoluta, mesmo
padrão de `Roda.imageUrl`), junto com `GET /profiles/me`
(`ProfilesService.getMe`), que devolve `bandeiraIds`/`interesseIds` já
selecionados — o `GET /users/:id` "público" não expõe essas listas
cruas, então o formulário de edição precisava de um endpoint próprio
para se pré-preencher. O formulário (`/perfil/editar`) e o seletor de
bandeiras/interesses (`MultiSelectGrid`) reaproveitam o padrão visual
de um protótipo de UI gerado à parte (`BannerSelector`/
`InterestSelector`/`MultiSelectButton`), mas consultam o catálogo real
(`GET /bandeiras`, `GET /interesses`) em vez de uma lista fixa de 21/25
itens embutida no componente.

[OWASP Password Storage Cheat Sheet]: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
