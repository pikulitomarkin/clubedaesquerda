import { IsEnum, IsOptional, IsString, IsUUID, IsUrl, MaxLength } from "class-validator";
import { RodaVisibility } from "@clube/database";

export class CreateRodaDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Enviada via POST /uploads antes da criação da roda.
  @IsOptional()
  @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional()
  @IsUUID()
  bandeiraId?: string;

  @IsEnum(RodaVisibility)
  visibility!: RodaVisibility;
}
