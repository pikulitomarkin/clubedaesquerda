export type TipoEvento = 'presencial' | 'online' | 'clube' | 'analise';
export type Recorrencia = 'nenhuma' | 'semanal' | 'quinzenal' | 'mensal';

export interface EventoBase {
  id: string;
  tipo: TipoEvento;
  nome: string;
  organizador: string;
  data: Date;
  horario: string;
  descricao: string;
  imagemCapa?: string;
  criadorId: string;
  criadoEm: Date;
  atualizadoEm: Date;
  ativo: boolean;
}

export interface EventoPresencial extends EventoBase {
  tipo: 'presencial';
  local: string;
  endereco: string;
  capacidade?: number;
  confirmados?: number;
}

export interface EventoOnline extends EventoBase {
  tipo: 'online';
  linkMeeting: string;
  plataforma: 'zoom' | 'meet' | 'jitsi' | 'outra';
  senhaOuToken?: string;
}

export interface EventoClube extends EventoBase {
  tipo: 'clube';
  local: string;
  recorrencia: Recorrencia;
  dataFim?: Date;
  proximosEncontros?: Date[];
  facilitadores: string[];
  tema?: string;
  objetivos?: string;
}

export interface EventoAnalise extends EventoBase {
  tipo: 'analise';
  local: string;
  recorrencia: Recorrencia;
  dataFim?: Date;
  proximosEncontros?: Date[];
  facilitadores: string[];
  textosPrepara?: string[];
  questoesChave?: string[];
  metodologia?: string;
}

export type Evento = EventoPresencial | EventoOnline | EventoClube | EventoAnalise;

export interface FiltrosEvento {
  tipo?: TipoEvento;
  busca?: string;
  dataInicio?: Date;
  dataFim?: Date;
  apenas_ativos?: boolean;
}

export interface CreateEventoFormData {
  nome: string;
  organizador: string;
  data: string;
  horario: string;
  descricao: string;
  imagemCapa?: string;
}

export interface CreateEventoPresencialData extends CreateEventoFormData {
  local: string;
  endereco: string;
  capacidade?: number;
}

export interface CreateEventoOnlineData extends CreateEventoFormData {
  linkMeeting: string;
  plataforma: 'zoom' | 'meet' | 'jitsi' | 'outra';
  senhaOuToken?: string;
}

export interface CreateEventoClubeSanaData extends CreateEventoFormData {
  local: string;
  recorrencia: Recorrencia;
  dataFim?: string;
  facilitadores: string[];
  tema?: string;
  objetivos?: string;
}

export interface CreateEventoAnaliseData extends CreateEventoFormData {
  local: string;
  recorrencia: Recorrencia;
  dataFim?: string;
  facilitadores: string[];
  textosPrepara?: string[];
  questoesChave?: string[];
  metodologia?: string;
}
