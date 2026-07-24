import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateRodaDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  // Enviada via POST /uploads antes da criação da roda.
  @IsOptional()
  @IsUrl({ require_protocol: true })
  imageUrl?: string;

  // "Giff da roda" — enviado via POST /uploads, em loop na página da Roda.
  @IsOptional()
  @IsUrl({ require_protocol: true })
  gifUrl?: string;

  // "Link de 3 músicas da roda".
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsUrl({ require_protocol: true }, { each: true })
  musicUrls?: string[];
}
