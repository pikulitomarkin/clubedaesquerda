import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, Transporter } from "nodemailer";

// Transporte SMTP genérico (funciona com qualquer provedor: SES, Resend,
// Mailgun, Gmail, ou Mailtrap/Maildev em desenvolvimento) — ver
// .env.example (SMTP_*). Envio é sempre disparado fora da transação de
// escrita que o originou (ver docs/contexto.md § "Verificação de e-mail"),
// para não acoplar a latência/disponibilidade do provedor de e-mail à
// resposta da API.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly webOrigin: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>("SMTP_FROM", "Clube da Esquerda <no-reply@clubedaesquerda.org>");
    this.webOrigin = this.config.get<string>("WEB_ORIGIN", "http://localhost:3000");

    this.transporter = createTransport({
      host: this.config.get<string>("SMTP_HOST", "localhost"),
      port: this.config.get<number>("SMTP_PORT", 1025),
      secure: this.config.get<string>("SMTP_SECURE", "false") === "true",
      auth: this.config.get<string>("SMTP_USER")
        ? { user: this.config.get<string>("SMTP_USER"), pass: this.config.get<string>("SMTP_PASS") }
        : undefined,
    });
  }

  async sendVerificationEmail(to: string, displayName: string, token: string) {
    const verifyUrl = `${this.webOrigin}/verificar-email?token=${encodeURIComponent(token)}`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: "Confirme seu e-mail — Clube da Esquerda",
        text: `Olá, ${displayName}! Confirme seu e-mail acessando: ${verifyUrl} (o link expira em 24 horas).`,
        html: `
          <p>Olá, ${displayName}!</p>
          <p>Confirme seu e-mail para ativar sua conta no Clube da Esquerda:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>Este link expira em 24 horas. Se você não fez este cadastro, ignore este e-mail.</p>
        `,
      });
    } catch (err) {
      // Falha de envio nunca deve derrubar o fluxo de cadastro, que já
      // foi persistido com sucesso — apenas logamos para observabilidade
      // e permitimos reenvio via endpoint dedicado.
      this.logger.error(`Falha ao enviar e-mail de verificação para ${to}`, err as Error);
    }
  }
}
