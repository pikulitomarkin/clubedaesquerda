import { IsUUID } from "class-validator";

// Múltiplos convites para a mesma pessoa são permitidos de propósito —
// ver comentário no schema (model Convite) e docs/contexto.md.
export class InviteDto {
  @IsUUID()
  inviteeId!: string;
}
