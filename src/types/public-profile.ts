export interface Roda {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category: 'conversa' | 'estudo' | 'acao' | 'social';
  frequency?: 'semanal' | 'quinzenal' | 'mensal';
  nextDate?: Date;
  participantCount?: number;
  imageUrl?: string;
  slug?: string;
}

export interface Evento {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  category: 'manifestacao' | 'debate' | 'formacao' | 'cultural' | 'social';
  imageUrl?: string;
  participantCount?: number;
  status: 'agendado' | 'em-andamento' | 'finalizado' | 'cancelado';
  slug?: string;
}

export interface Homenagem {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  message: string;
  createdAt: Date;
  type: 'apoio' | 'reconhecimento' | 'agradecimento' | 'solidariedade';
  isVisible: boolean; // Preferência do usuário
}

export interface PublicUserProfile {
  id: string;
  name: string;
  avatar?: string;
  photos: string[];
  description: string;
  banners: string[];
  interests: string[];
  rodas: string[]; // IDs das rodas
  eventos: string[]; // IDs dos eventos
  homenagens: Homenagem[];
  showHomenagens: boolean; // Preferência global de visibilidade
  followers?: number;
  followersOf?: number;
  createdAt: Date;
  isFollowing?: boolean; // Do ponto de vista do usuário logado
  isSelf?: boolean; // Se é o próprio perfil do usuário
}
