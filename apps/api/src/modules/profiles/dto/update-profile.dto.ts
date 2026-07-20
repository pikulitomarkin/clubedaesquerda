import { IsArray, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  // Enviada via POST /uploads.
  @IsOptional()
  @IsUrl({ require_protocol: true })
  photoUrl?: string;

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
