import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from "class-validator";

// Limites do spec do cliente: descrição de até 600 caracteres (com espaço)
// e galeria de até 3 fotos.
export const BIO_MAX_LENGTH = 600;
export const MAX_PROFILE_PHOTOS = 3;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(BIO_MAX_LENGTH, {
    message: `A descrição deve ter no máximo ${BIO_MAX_LENGTH} caracteres`,
  })
  bio?: string;

  // Galeria de até 3 fotos, enviadas via POST /uploads. A primeira vira a
  // foto principal (Profile.photoUrl) — ver ProfilesService.update.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PROFILE_PHOTOS, { message: `Você pode enviar até ${MAX_PROFILE_PHOTOS} fotos` })
  @IsUrl({ require_protocol: true }, { each: true })
  photos?: string[];

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  bandeiraIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  interesseIds?: string[];
}
