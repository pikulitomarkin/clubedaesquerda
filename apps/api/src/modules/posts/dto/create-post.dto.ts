import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { PostVisibility } from "@clube/database";

export class CreatePostDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsUUID()
  rodaId?: string;

  // Post dentro de uma Mesa — ver docs/contexto.md § "Posts nas Mesas".
  // Independente de rodaId (não precisa repetir a roda-mãe da mesa).
  @IsOptional()
  @IsUUID()
  mesaId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsEnum(PostVisibility)
  visibility!: PostVisibility;
}
