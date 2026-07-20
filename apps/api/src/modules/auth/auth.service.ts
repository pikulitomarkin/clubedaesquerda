import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import { Prisma, UserStatus } from "@clube/database";
import { PrismaService } from "../common/prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { cpfLast4, hashCpf, isValidCpf } from "./crypto/cpf.util";

const MAX_FAILED_ATTEMPTS = 5;
// Backoff limitado a 1h (antes 24h): impede que um atacante que conheça o
// CPF da vítima a mantenha bloqueada por um dia inteiro (DoS dirigido).
// Ver docs/contexto.md §1.2.
const LOCKOUT_BACKOFF_MINUTES = [1, 5, 15, 30, 60];
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60_000;

// Versões vigentes dos documentos aceitos no cadastro. Qualquer mudança
// material exige nova versão + re-consentimento (ver docs/contexto.md §2).
const TERMS_VERSION = "terms-of-service-2026-07";
const PRIVACY_VERSION = "privacy-policy-2026-07";

// Status que impedem autenticação (login e refresh). PENDING_VERIFICATION é
// permitido logar (a UI usa o flag emailVerified para pedir a verificação);
// SUSPENDED/BANNED/DELETED nunca autenticam.
const BLOCKED_STATUSES: UserStatus[] = [UserStatus.SUSPENDED, UserStatus.BANNED, UserStatus.DELETED];

const GENERIC_AUTH_ERROR = "CPF ou senha inválidos";

@Injectable()
export class AuthService implements OnModuleInit {
  // Hash Argon2id descartável usado para equalizar o tempo de resposta quando
  // o CPF não existe — sem ele, o caminho "usuário inexistente" retornaria
  // antes do argon2.verify e criaria um oráculo de timing para enumeração.
  private dummyPasswordHash!: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    this.dummyPasswordHash = await argon2.hash(randomBytes(32).toString("hex"), {
      type: argon2.argon2id,
    });
  }

  private get cpfPepper(): string {
    return this.config.getOrThrow<string>("CPF_PEPPER");
  }

  // Ver docs/contexto.md §3.1 — unicidade de CPF resolvida pela constraint
  // @unique do Postgres (P2002 capturado abaixo), não por SELECT prévio.
  async register(dto: RegisterDto, meta: { ip?: string }) {
    if (!isValidCpf(dto.cpf)) {
      // Formato/dígito verificador de CPF é calculável no cliente, então
      // rejeitar aqui não revela nada sobre quem está cadastrado.
      throw new BadRequestException("Dados de cadastro inválidos");
    }

    const cpfHash = hashCpf(dto.cpf, this.cpfPepper);
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const userId = randomUUID();

    let created: { id: string };
    try {
      created = await this.prisma.$transaction(async (tx) => {
        // API tipada em vez de INSERT cru: a unicidade de cpfHash continua
        // sendo garantida atomicamente pela constraint do Postgres (o
        // P2002 capturado abaixo é o equivalente exato do ON CONFLICT DO
        // NOTHING), sem acoplar o código ao nome físico das colunas.
        await tx.user.create({
          data: {
            id: userId,
            cpfHash,
            cpfLast4: cpfLast4(dto.cpf),
            email: dto.email,
            passwordHash,
            passwordAlgo: "argon2id",
            status: "PENDING_VERIFICATION",
            role: "MEMBER",
          },
          select: { id: true },
        });

        await tx.profile.create({
          data: {
            userId,
            displayName: dto.displayName,
            birthDate: new Date(dto.birthDate),
            gender: dto.gender,
            city: dto.city,
            state: dto.state.toUpperCase(),
          },
        });

        // Base legal do tratamento (LGPD): registra o aceite explícito de
        // Termos e Política de Privacidade (booleans obrigatórios no DTO) na
        // mesma transação do cadastro — artefato de consentimento auditável.
        await tx.userConsent.createMany({
          data: [
            { userId, type: "TERMS_OF_SERVICE", version: TERMS_VERSION, ip: meta.ip },
            { userId, type: "PRIVACY_POLICY", version: PRIVACY_VERSION, ip: meta.ip },
          ],
        });

        return { id: userId };
      });
    } catch (e) {
      // Conflito de CPF **ou** de e-mail chega como P2002. Normalizamos os
      // dois para a mesma resposta genérica: não confirma qual dos dois já
      // existe (evita enumeração) nem vaza 500/stack trace.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Não foi possível concluir o cadastro");
      }
      throw e;
    }

    // Disparado fora da transação de escrita: disponibilidade do
    // provedor de e-mail não deve bloquear a confirmação do cadastro
    // (ver docs/contexto.md § "Verificação de e-mail").
    await this.issueEmailVerification(created.id, dto.email, dto.displayName);

    return { id: created.id };
  }

  private async issueEmailVerification(userId: string, email: string, displayName: string) {
    const tokenPlain = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(tokenPlain).digest("hex");

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });

    await this.emailService.sendVerificationEmail(email, displayName, tokenPlain);
  }

  // Ver docs/contexto.md § "Verificação de e-mail" — token de uso único,
  // hash comparado (nunca o valor em texto plano é persistido).
  async verifyEmail(tokenPlain: string) {
    const tokenHash = createHash("sha256").update(tokenPlain).digest("hex");
    const stored = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.consumedAt || stored.expiresAt < new Date()) {
      throw new BadRequestException("Link de verificação inválido ou expirado");
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: stored.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerified: true, status: "ACTIVE" },
      }),
    ]);
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { profile: true } });
    if (user.emailVerified) return;
    await this.issueEmailVerification(user.id, user.email, user.profile?.displayName ?? "");
  }

  // Ver docs/contexto.md §1.2 — lockout com backoff e mensagens genéricas.
  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    // Formato inválido de CPF não revela existência (dígito verificador é
    // público); resposta genérica mantém a uniformidade das mensagens.
    if (!isValidCpf(dto.cpf)) {
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    const cpfHash = hashCpf(dto.cpf, this.cpfPepper);
    const user = await this.prisma.user.findUnique({ where: { cpfHash } });

    // Executa Argon2id SEMPRE — contra o hash real se o usuário existe, ou
    // contra um hash descartável se não existe — para que o tempo de resposta
    // não distinga "CPF cadastrado" de "CPF inexistente" (anti-enumeração).
    const passwordOk = await argon2.verify(user?.passwordHash ?? this.dummyPasswordHash, dto.password);

    const isBlocked = !user || !!user.deletedAt || BLOCKED_STATUSES.includes(user.status);

    if (isBlocked || !passwordOk) {
      // Só conta como tentativa de força bruta se a conta é válida (evita
      // criar bloqueios em CPFs inexistentes e uniformiza a resposta).
      if (user && !isBlocked) {
        await this.registerFailedAttempt(user.id);
      }
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    // Senha correta e conta válida. O bloqueio temporário só é revelado aqui
    // — para quem já provou conhecer a senha — nunca para um atacante que
    // erra a senha (que sempre recebe a mensagem genérica acima), de modo que
    // a mensagem de bloqueio não vira oráculo de existência do CPF.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException("Conta temporariamente bloqueada. Tente novamente mais tarde.");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: meta.ip },
    });

    const tokens = await this.issueTokens(user.id, user.role, meta);
    return { ...tokens, emailVerified: user.emailVerified };
  }

  // Incremento ATÔMICO do contador de falhas via operação atômica do Prisma
  // (SET failed_login_attempts = failed_login_attempts + 1 no Postgres, sob
  // row lock). Isso elimina o lost update do read-modify-write anterior, em
  // que tentativas concorrentes contra a mesma conta liam o mesmo valor e o
  // contador nunca alcançava o limite de bloqueio. O teto de backoff (60 min,
  // ver LOCKOUT_BACKOFF_MINUTES) limita o uso do lockout como DoS dirigido.
  private async registerFailedAttempt(userId: string) {
    const { failedLoginAttempts } = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });

    if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      const idx = Math.min(failedLoginAttempts - MAX_FAILED_ATTEMPTS, LOCKOUT_BACKOFF_MINUTES.length - 1);
      const lockedUntil = new Date(Date.now() + LOCKOUT_BACKOFF_MINUTES[idx]! * 60_000);
      await this.prisma.user.update({ where: { id: userId }, data: { lockedUntil } });
    }
  }

  private async issueTokens(userId: string, role: string, meta: { ip?: string; userAgent?: string }) {
    const accessToken = await this.jwt.signAsync({ sub: userId, role });

    const refreshTokenPlain = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(refreshTokenPlain).digest("hex");

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return { accessToken, refreshToken: refreshTokenPlain };
  }

  // Expiração do refresh token derivada de JWT_REFRESH_EXPIRES_IN (ex.: "30d",
  // "12h", "45m"), em vez de constante hardcoded.
  private refreshTtlMs(): number {
    const raw = this.config.get<string>("JWT_REFRESH_EXPIRES_IN", "30d").trim();
    const match = /^(\d+)\s*([smhd])$/.exec(raw);
    if (!match) return 30 * 24 * 60 * 60_000;
    const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as "s" | "m" | "h" | "d"];
    return Number(match[1]) * unit;
  }

  // Ver docs/contexto.md §1.3 — rotação obrigatória + reuse detection.
  async refresh(refreshTokenPlain: string | undefined, meta: { ip?: string; userAgent?: string }) {
    if (!refreshTokenPlain) {
      throw new UnauthorizedException("Sessão expirada, faça login novamente");
    }

    const tokenHash = createHash("sha256").update(refreshTokenPlain).digest("hex");
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Sessão expirada, faça login novamente");
    }

    if (stored.revokedAt) {
      // Token já usado anteriormente sendo reapresentado: possível roubo.
      // Revoga toda a cadeia do usuário e força novo login.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Sessão inválida, faça login novamente");
    }

    // Conta banida/suspensa/excluída não pode renovar sessão — sem isso, o
    // banimento nunca "pega" enquanto houver rotação de refresh token.
    if (stored.user.deletedAt || BLOCKED_STATUSES.includes(stored.user.status)) {
      throw new UnauthorizedException("Sessão inválida, faça login novamente");
    }

    // Compare-and-swap atômico: apenas quem efetivamente revoga este token
    // (count === 1) segue para emitir a nova cadeia. Dois refresh concorrentes
    // com o mesmo token — o perdedor recebe count === 0 e é rejeitado, o que
    // impede duas cadeias válidas nascerem de uma única apresentação (TOCTOU).
    const won = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (won.count !== 1) {
      throw new UnauthorizedException("Sessão inválida, faça login novamente");
    }

    const { accessToken, refreshToken } = await this.issueTokens(stored.userId, stored.user.role, meta);
    const newHash = createHash("sha256").update(refreshToken).digest("hex");

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedByTokenHash: newHash },
    });

    return { accessToken, refreshToken };
  }

  async logout(refreshTokenPlain: string) {
    const tokenHash = createHash("sha256").update(refreshTokenPlain).digest("hex");
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
