import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import { EventoTipo, RecurrenceFrequency } from "@clube/database";

export class CreateEventoDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsEnum(EventoTipo)
  tipo!: EventoTipo;

  // Obrigatório para PRESENCIAL.
  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "PRESENCIAL")
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Length(2, 2)
  state?: string;

  // Obrigatório para ONLINE.
  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "ONLINE")
  @IsUrl({ require_protocol: true })
  onlineUrl?: string;

  @IsOptional()
  @IsUUID()
  rodaId?: string;

  @IsOptional()
  @IsUUID()
  bandeiraId?: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  // Regra de repetição definida pelo organizador — ausente/undefined =
  // evento único (ver docs/contexto.md § "Eventos únicos vs.
  // recorrentes/permanentes").
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  recurrenceFrequency?: RecurrenceFrequency;

  // Só relevante se recurrenceFrequency estiver presente. Ausente =
  // evento "permanente" (recorre sem data de término definida).
  @IsOptional()
  @IsDateString()
  recurrenceUntil?: string;
}
