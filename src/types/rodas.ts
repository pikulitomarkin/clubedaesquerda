export interface LinkMusica {
  id: string;
  url: string;
  titulo?: string;
  plataforma?: 'spotify' | 'youtube' | 'soundcloud' | 'outra';
}

export interface Mesa {
  id: string;
  rodaId: string;
  nome: string;
  descricao: string;
  criadorId: string;
  criadoEm: Date;
  atualizadoEm: Date;
  ordem: number;
}

export interface Roda {
  id: string;
  nome: string;
  descricao: string;
  imagemCapa?: string;
  gifLoop?: string;
  musicas: LinkMusica[];
  mesas: Mesa[];
  criadorId: string;
  criadoEm: Date;
  atualizadoEm: Date;
  ativo: boolean;
  tags?: string[];
  categoria?: string;
  participantesCount?: number;
}

export interface CreateRodaDTO {
  nome: string;
  descricao: string;
  imagemCapa?: string;
  gifLoop?: string;
  musicas: LinkMusica[];
  tags?: string[];
  categoria?: string;
}

export interface CreateMesaDTO {
  rodaId: string;
  nome: string;
  descricao: string;
  ordem?: number;
}

export interface FiltrosRoda {
  busca?: string;
  categoria?: string;
  apenas_ativas?: boolean;
  ordenar?: 'recentes' | 'nome' | 'populares';
}
