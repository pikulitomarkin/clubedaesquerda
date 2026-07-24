import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

export class CreateMesaDto {
  @IsString()
  @MaxLength(30)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  description?: string;

  @IsOptional()
  @IsUUID()
  rodaId?: string;

  @IsOptional()
  @IsUUID()
  eventoId?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  capacity?: number;
}
