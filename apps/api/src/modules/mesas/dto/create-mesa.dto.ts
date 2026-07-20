import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateMesaDto {
  @IsString()
  name!: string;

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
