export interface Usuario {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface Mensagem {
  id: string;
  conversaId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  edited?: boolean;
  editedAt?: Date;
}

export interface Conversa {
  id: string;
  name: string;
  type: 'individual' | 'grupo';
  participants: Usuario[];
  lastMessage?: Mensagem;
  lastMessageAt?: Date;
  unreadCount: number;
  avatar?: string;
  description?: string;
  isArchived?: boolean;
  isPinned?: boolean;
}

export interface ChatState {
  conversas: Conversa[];
  selectedConversas: string[]; // Até 2 IDs
  messages: Record<string, Mensagem[]>; // Por conversaId
  currentUser: Usuario;
  isLoading: boolean;
  error?: string;
}

export interface SendMessageData {
  conversaId: string;
  content: string;
}

export interface ChatContextType {
  state: ChatState;
  openConversa: (conversaId: string) => void;
  closeConversa: (conversaId: string) => void;
  sendMessage: (data: SendMessageData) => Promise<void>;
  loadMessages: (conversaId: string) => Promise<void>;
  markAsRead: (conversaId: string) => void;
  searchConversas: (query: string) => Conversa[];
}
