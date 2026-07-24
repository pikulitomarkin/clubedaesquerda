import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from "class-validator";

// "Botão RODA DE CONVERSA" (página de chat): cria um grupo avulso,
// selecionando várias pessoas, com nome e imagem da aba.
export class CreateGroupChatDto {
  @IsArray()
  @ArrayMinSize(1, { message: "Selecione ao menos uma pessoa" })
  @ArrayMaxSize(50, { message: "Uma roda de conversa aceita até 50 pessoas" })
  @ArrayUnique()
  @IsUUID("4", { each: true })
  participantIds!: string[];

  @IsString()
  @MaxLength(80)
  name!: string;

  // Enviada via POST /uploads (mesma origem de outras imagens do produto).
  @IsOptional()
  @IsUrl({ require_protocol: true })
  imageUrl?: string;
}
