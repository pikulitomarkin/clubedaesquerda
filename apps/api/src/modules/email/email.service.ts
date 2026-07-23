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

// displayName é controlado pelo usuário; escapar antes de interpolar no HTML
// do e-mail evita injeção de marcação no cliente de e-mail do destinatário.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    const nome = escapeHtml(displayName);

    await this.send({
      to,
      subject: "Confirme seu e-mail — Clube da Esquerda",
      text: `Olá, ${displayName}! Confirme seu e-mail acessando: ${verifyUrl} (o link expira em 24 horas).`,
      html: `
        <p>Olá, ${nome}!</p>
        <p>Confirme seu e-mail para ativar sua conta no Clube da Esquerda:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Este link expira em 24 horas. Se você não fez este cadastro, ignore este e-mail.</p>
      `,
    });
  }

  // Enviado quando a conta é ATIVADA (e-mail verificado), não no cadastro —
  // evita dois e-mails simultâneos e só dá as boas-vindas a quem confirmou.
  async sendWelcomeEmail(to: string, displayName: string) {
    const nome = escapeHtml(displayName);

    await this.send({
      to,
      subject: "Boas-vindas ao Clube da Esquerda!",
      text: `Olá, ${displayName}! Sua conta está ativa. Boas-vindas ao Clube da Esquerda — entre em ${this.webOrigin} e comece a participar.`,
      html: `
        <p>Olá, ${nome}!</p>
        <p>Sua conta foi confirmada e já está ativa. <strong>Boas-vindas ao Clube da Esquerda!</strong></p>
        <p>Entre em <a href="${this.webOrigin}">${this.webOrigin}</a>, complete seu perfil e comece a participar das rodas de conversa.</p>
        <p>Um abraço camarada. ✊</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, displayName: string, token: string) {
    const resetUrl = `${this.webOrigin}/redefinir-senha?token=${encodeURIComponent(token)}`;
    const nome = escapeHtml(displayName);

    await this.send({
      to,
      subject: "Recuperação de conta — Clube da Esquerda",
      text: `Olá, ${displayName}! Recebemos um pedido para redefinir sua senha. Acesse ${resetUrl} (o link expira em 1 hora). Se não foi você, ignore este e-mail — sua senha continua a mesma.`,
      html: `
        <p>Olá, ${nome}!</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta no Clube da Esquerda.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este link expira em 1 hora e só pode ser usado uma vez. Se não foi você que pediu, ignore este e-mail — sua senha continua a mesma.</p>
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
