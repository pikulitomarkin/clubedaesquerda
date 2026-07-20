import { IsIn, IsOptional, IsString, IsUUID, IsUrl, MaxLength, ValidateIf } from "class-validator";

// DECISÃO: só TEXT e GIF podem ser enviados por aqui — sem upload de
// foto/vídeo no chat (ver docs/contexto.md § "Mensagens: links, GIFs e
// emojis"). IMAGE/AUDIO seguem existindo no enum MessageType do banco
// para uso futuro (ex.: SYSTEM já é usado hoje por outros fluxos), mas
// este DTO não os aceita.
const SENDABLE_TYPES = ["TEXT", "GIF"] as const;
export type SendableMessageType = (typeof SENDABLE_TYPES)[number];

export class SendMessageDto {
  @IsUUID()
  chatId!: string;

  @IsIn(SENDABLE_TYPES)
  type!: SendableMessageType;

  // Texto livre: pode conter links (o client faz linkify) e shortcodes
  // de emoji personalizado (:codigo:, resolvidos contra GET /emojis).
  @ValidateIf((dto: SendMessageDto) => dto.type === "TEXT")
  @IsString()
  @MaxLength(4000)
  content?: string;

  // Exigido para GIF: URL absoluta de um provedor externo (busca via
  // GET /gifs/search) — nunca um caminho de /uploads, que é reservado a
  // outros fluxos (evidência de denúncia, imagem de roda, emoji).
  @ValidateIf((dto: SendMessageDto) => dto.type === "GIF")
  @IsUrl({ protocols: ["https"], require_protocol: true })
  mediaUrl?: string;
}
