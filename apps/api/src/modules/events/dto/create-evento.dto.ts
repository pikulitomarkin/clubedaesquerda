import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import { ClubeTipo, EventoTipo, RecurrenceMode } from "@clube/database";

const TIPOS_COM_LINK = ["ONLINE", "CLUBE", "ANALISE"];
const TIPOS_COM_DATA_FIXA = ["PRESENCIAL", "ONLINE", "CLUBE"];
const TIPOS_PAGO_GRATUITO = ["PRESENCIAL", "ONLINE", "CLUBE"];
const TIPOS_COM_RECORRENCIA = ["CLUBE", "ANALISE"];

// Um único DTO para os 4 popups do spec (Presencial/Online/Clube/Análise):
// os campos de cada tipo são todos opcionais aqui e só viram obrigatórios
// via @ValidateIf(tipo), espelhando a regra de negócio de cada popup.
export class CreateEventoDto {
  @IsEnum(EventoTipo)
  tipo!: EventoTipo;

  // "nome do evento" (ou "nome do canal", para Análises)
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  organizerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  coverImageUrl?: string;

  // --- Presencial ---
  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "PRESENCIAL")
  @IsString()
  @MaxLength(150)
  locationName?: string;

  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "PRESENCIAL")
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  locationUrl?: string;

  // --- Online / Clube / Análise ---
  @ValidateIf((dto: CreateEventoDto) => TIPOS_COM_LINK.includes(dto.tipo))
  @IsUrl({ require_protocol: true })
  onlineUrl?: string;

  // --- Pago ou gratuito (Presencial/Online/Clube) ---
  @ValidateIf((dto: CreateEventoDto) => TIPOS_PAGO_GRATUITO.includes(dto.tipo))
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  ticketUrl?: string;

  // --- Clube ---
  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "CLUBE")
  @IsEnum(ClubeTipo)
  clubeTipo?: ClubeTipo;

  // --- Clube e Análise ---
  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "CLUBE" || dto.tipo === "ANALISE")
  @IsString()
  @MaxLength(150)
  obraNome?: string;

  // --- Data/horário fixos (Presencial/Online/Clube) ---
  @ValidateIf((dto: CreateEventoDto) => TIPOS_COM_DATA_FIXA.includes(dto.tipo))
  @IsDateString()
  startsAt?: string;

  // --- Dia da semana + horário (Análise, sem data fixa) ---
  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "ANALISE")
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ValidateIf((dto: CreateEventoDto) => dto.tipo === "ANALISE")
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  time?: string;

  // --- Recorrência (Clube e Análise) ---
  @ValidateIf((dto: CreateEventoDto) => TIPOS_COM_RECORRENCIA.includes(dto.tipo))
  @IsEnum(RecurrenceMode)
  recurrenceMode?: RecurrenceMode;

  @ValidateIf((dto: CreateEventoDto) => dto.recurrenceMode === "RECORRENTE" || dto.recurrenceMode === "PERMANENTE")
  @IsString()
  @MaxLength(200)
  recurrenceText?: string;
}
