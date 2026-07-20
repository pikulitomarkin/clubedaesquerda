import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from "class-validator";
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

  // Evidências passam a ser validadas como URLs http(s) reais: sem isto,
  // strings arbitrárias (ex.: "javascript:...", URLs internas) chegavam ao
  // painel do moderador — risco de XSS armazenado/SSRF conforme a renderização
  // — e sem teto de tamanho/quantidade. Limitamos a 10 itens de até 2048 chars.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ protocols: ["http", "https"], require_protocol: true }, { each: true })
  @MaxLength(2048, { each: true })
  evidenceUrls?: string[];
}
