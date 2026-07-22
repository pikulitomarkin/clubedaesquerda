import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";
import { ReportCategory } from "@clube/database";

export class CreateReportDto {
  @IsUUID()
  reportedUserId!: string;

  @IsEnum(ReportCategory)
  category!: ReportCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  // Referências opacas de evidência, retornadas por POST /reports/evidence —
  // NÃO URLs. Antes o campo era uma URL pública: além de permitir strings
  // arbitrárias (javascript:, host interno) chegando ao painel do moderador,
  // as evidências ficavam legíveis por qualquer um com o link (o furo do C3).
  // Agora o anexo vive em diretório privado e só é lido pela rota autenticada
  // GET /reports/:id/evidence/:index. O regex ancora o formato UUID.ext e
  // barra qualquer path traversal (sem barras, sem "..").
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @Matches(/^[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif|pdf)$/i, {
    each: true,
    message: "Referência de evidência inválida",
  })
  evidenceRefs?: string[];
}
