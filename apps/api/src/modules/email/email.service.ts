import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// Envio via API HTTP do Resend (https://resend.com/docs). Preferida ao SMTP
// porque muitos provedores de VPS bloqueiam as portas de saída 25/465/587 —
// a API é HTTPS puro e não sofre disso. Sem SDK: `fetch` é global no Node 20.
//
// O envio é sempre disparado FORA da transação de escrita que o originou
// (ver docs/contexto.md § "Verificação de e-mail"), e uma falha nunca
// derruba o cadastro — apenas loga; o usuário pode reenviar pelo endpoint
// dedicado.
const RESEND_ENDPOINT = "https://api.resend.com/emails";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;
  private readonly from: string;
  private readonly webOrigin: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>("RESEND_API_KEY");
    this.from = this.config.get<string>("MAIL_FROM", "Clube da Esquerda <no-reply@clubedaesquerda.org>");
    this.webOrigin = this.config.get<string>("WEB_ORIGIN", "http://localhost:3000");
  }

  async sendVerificationEmail(to: string, displayName: string, token: string) {
    const verifyUrl = `${this.webOrigin}/verificar-email?token=${encodeURIComponent(token)}`;

    await this.send({
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
  }

  private async send(msg: { to: string; subject: string; text: string; html: string }) {
    if (!this.apiKey) {
      // Sem chave configurada, não há como enviar — logamos e seguimos (o
      // cadastro não pode depender disto). Útil em dev sem provedor.
      this.logger.warn(`RESEND_API_KEY ausente — e-mail para ${msg.to} não enviado.`);
      return;
    }

    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: this.from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        this.logger.error(`Resend respondeu ${res.status} ao enviar para ${msg.to}: ${body}`);
      }
    } catch (err) {
      this.logger.error(`Falha ao enviar e-mail para ${msg.to}`, err as Error);
    }
  }
}
