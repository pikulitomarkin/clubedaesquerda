# Interface de Chat - Clube da Esquerda

Sistema completo de mensagens diretas com suporte a conversas individuais e em grupo, até 2 abas simultâneas, e histórico persistido no localStorage.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Componentes](#componentes)
- [Hook useChat](#hook-usechat)
- [Persistência](#persistência)
- [Como Usar](#como-usar)

## ✨ Funcionalidades

### Layout
- ✅ **Sidebar esquerda**: Lista de conversas com apenas nomes
- ✅ **Painel central/direito**: Até 2 abas simultâneas
- ✅ **Responsivo**: Adapta-se a diferentes tamanhos
- ✅ **Multi-conversa**: Abra até 2 chats ao mesmo tempo

### Conversas
- ✅ Conversas individuais (1-to-1)
- ✅ Conversas em grupo (múltiplos participantes)
- ✅ Status online/offline/away
- ✅ Último horário visto
- ✅ Badge de não lidas
- ✅ Busca por nome
- ✅ Fixar conversas (pinned)
- ✅ Ordenação por recência
- ✅ Prévia da última mensagem

### Mensagens
- ✅ Envio de mensagens
- ✅ Histórico persistido por conversa
- ✅ Avatares do remetente
- ✅ Timestamp de cada mensagem
- ✅ Status de leitura (✓✓)
- ✅ Indicador de mensagens editadas
- ✅ Suporte a quebras de linha
- ✅ Auto-scroll para novas mensagens
- ✅ Limite de 1000 caracteres

### Controles
- ✅ Enviar com Ctrl/Cmd + Enter
- ✅ Quebra de linha com Shift + Enter
- ✅ Auto-resize do input
- ✅ Abrir/fechar conversas
- ✅ Indicador de carregamento
- ✅ Tratamento de erros

## 🏗️ Arquitetura

```
src/
├── types/
│   └── chat.ts                        # Interfaces
├── data/
│   └── conversations.ts               # Dados de exemplo
├── hooks/
│   └── useChat.ts                     # Gerenciamento de estado
├── components/
│   ├── ConversationList.tsx           # Lista esquerda
│   ├── ChatPanel.tsx                  # Painel individual
│   ├── ChatTabs.tsx                   # Abas (até 2)
│   ├── ChatMessage.tsx                # Mensagem individual
│   ├── ChatInput.tsx                  # Input com send
│   └── Chat/index.ts                  # Exportações
└── pages/
    └── ChatPage.tsx                   # Página completa

localStorage: 'club_esquerda_messages'  # Persistência
```

## 🔧 Componentes

### ConversationList

Lista de conversas na sidebar esquerda.

**Props:**
```typescript
interface ConversationListProps {
  conversas: Conversa[];
  selectedIds: string[];
  onSelectConversa: (conversaId: string) => void;
  searchQuery?: string;
}
```

**Características:**
- Campo de busca
- Avatar (com dot de status para individuais)
- Nome da conversa
- Prévia da última mensagem
- Timestamp da última mensagem
- Badge de não lidas
- Indicador de fixado (📌)
- Botão "Nova Conversa"
- Hover effects

---

### ChatPanel

Painel de uma conversa individual.

**Props:**
```typescript
interface ChatPanelProps {
  conversa: Conversa;
  messages: Mensagem[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onClose?: () => void;
  currentUserId: string;
}
```

**Características:**
- Header com nome, status e info
- Área de mensagens scrollável
- Auto-scroll para novas mensagens
- Input de mensagem
- Indicador "Carregando..."
- Empty state

---

### ChatTabs

Gerencia até 2 painéis de chat simultaneamente.

**Props:**
```typescript
interface ChatTabsProps {
  conversas: Conversa[];
  selectedConversaIds: string[];
  messages: Record<string, Mensagem[]>;
  isLoading: boolean;
  onSendMessage: (conversaId: string, content: string) => Promise<void>;
  onCloseConversa: (conversaId: string) => void;
  currentUserId: string;
}
```

**Características:**
- Grid responsivo (1 col se 1 aba, 2 cols se 2 abas)
- Empty state quando nenhuma conversa selecionada
- Renderiza múltiplos ChatPanel lado a lado

---

### ChatMessage

Mensagem individual no chat.

**Props:**
```typescript
interface ChatMessageProps {
  message: Mensagem;
  isOwn: boolean;
  showAvatar?: boolean;
}
```

**Características:**
- Bubble colorida (terracota se própria, linen se outros)
- Avatar do remetente
- Nome do remetente (se grupo)
- Conteúdo com line breaks
- Timestamp
- Status de leitura (✓✓)
- Indicador editado
- Alinhamento diferente (direita/esquerda)

---

### ChatInput

Input para digitar e enviar mensagens.

**Props:**
```typescript
interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}
```

**Características:**
- Textarea com auto-resize (máx 120px)
- Contador de caracteres (até 1000)
- Botão send
- Indicadores de teclado (Ctrl+Enter, Shift+Enter)
- Desabilitado enquanto envia
- Estado de erro visual

---

## 🪝 Hook: useChat

Gerencia todo o estado de chat e persistência.

**Retorna:**
```typescript
{
  selectedConversas: string[];         // Até 2 IDs
  messages: Record<string, Mensagem[]>;
  isLoading: boolean;
  error?: string;
  openConversa: (id: string) => void;
  closeConversa: (id: string) => void;
  sendMessage: (data) => Promise<void>;
  loadMessages: (id: string) => Promise<void>;
  markAsRead: (id: string) => void;
  searchConversas: (query: string) => Conversa[];
}
```

**Características:**
- Limite de 2 conversas abertas
- Auto-scroll interno
- Persistência em localStorage
- Simulação de API (300ms delay)
- Geração de IDs de mensagem
- Timestamps automáticos

---

## 💾 Persistência

### localStorage

**Chave:** `club_esquerda_messages`

**Formato:**
```json
{
  "conversa-1": [
    {
      "id": "msg-1",
      "conversaId": "conversa-1",
      "userId": "user-1",
      "userName": "Marina Silva",
      "content": "Oi!",
      "timestamp": "2026-07-19T10:30:00.000Z",
      "isRead": true
    }
  ]
}
```

**Características:**
- Salva automaticamente após enviar
- Carrega ao montar o componente
- Preserva quebras de linha
- Mantém timestamps como ISO strings
- Suporta até ~5-10MB (limite do navegador)

### Como recuperar dados

```typescript
const stored = localStorage.getItem('club_esquerda_messages');
const messages = JSON.parse(stored);
```

---

## 📋 Tipos de Dados

### Usuario
```typescript
interface Usuario {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}
```

### Mensagem
```typescript
interface Mensagem {
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
```

### Conversa
```typescript
interface Conversa {
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
```

---

## 🚀 Como Usar

### Página Completa

```jsx
import { ChatPage } from '@/pages/ChatPage';

export default function App() {
  return <ChatPage />;
}
```

### Componentes Individuais

```jsx
import {
  ConversationList,
  ChatTabs,
} from '@/components/Chat';
import { useChat } from '@/hooks/useChat';

function MyChatApp() {
  const {
    selectedConversas,
    messages,
    openConversa,
    closeConversa,
    sendMessage,
  } = useChat(conversas, currentUser);

  return (
    <div className="flex gap-4">
      <ConversationList
        conversas={conversas}
        selectedIds={selectedConversas}
        onSelectConversa={openConversa}
      />

      <ChatTabs
        conversas={conversas}
        selectedConversaIds={selectedConversas}
        messages={messages}
        isLoading={false}
        onSendMessage={sendMessage}
        onCloseConversa={closeConversa}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
```

### Usar Hook Customizado

```typescript
const {
  selectedConversas,
  messages,
  isLoading,
  error,
  openConversa,
  closeConversa,
  sendMessage,
  loadMessages,
  markAsRead,
  searchConversas,
} = useChat(conversas, currentUser);

// Abrir conversa
openConversa('conversa-1');

// Enviar mensagem
await sendMessage({
  conversaId: 'conversa-1',
  content: 'Olá!',
});

// Buscar
const resultados = searchConversas('Marina');
```

---

## 🎨 Layout & Responsividade

### Desktop (>1024px)
```
┌──────────────────────────────────────────┐
│ Header: Mensagens Diretas                │
├──────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────┐  │
│ │ Conversa│ │ Chat Panel 1            │  │
│ │ List    │ ├─────────────────────────┤  │
│ │ (w-64)  │ │ Chat Panel 2 (optional) │  │
│ │         │ └─────────────────────────┘  │
│ └─────────┘                              │
├──────────────────────────────────────────┤
│ Footer: Dica                             │
└──────────────────────────────────────────┘
```

### Tablet (640-1024px)
```
┌─────────────────┐
│ Header          │
├────┬────────────┤
│Con │ Chat Panel │
│ver │ (fullw)   │
│sar │            │
│List │ Chat Panel2│
│    │            │
└────┴────────────┘
```

### Mobile (<640px)
```
┌──────────────┐
│ Header       │
├──────────────┤
│ Conv List    │
│ (expandir)   │
│              │
│ Chat Panel   │
│ (fullw)      │
└──────────────┘
```

---

## 🔄 Fluxo de Dados

### Abrir Conversa
```
1. Usuário clica em conversa na lista
   ↓
2. openConversa(id) chamado
   ↓
3. selectedConversas += id (máx 2)
   ↓
4. useEffect detecta mudança
   ↓
5. loadMessages(id) chamado
   ↓
6. Messages carregadas do localStorage
   ↓
7. markAsRead(id) chamado
   ↓
8. ChatPanel renderizado
```

### Enviar Mensagem
```
1. Usuário digita e pressiona Ctrl+Enter
   ↓
2. handleSubmit chamado
   ↓
3. onSendMessage(content)
   ↓
4. Nova Mensagem criada com ID único
   ↓
5. Messages estado atualizado
   ↓
6. Salvo em localStorage
   ↓
7. Input limpado
   ↓
8. Auto-scroll para novas mensagens
```

---

## 📊 Dados de Exemplo

### Conversas (6)
1. Marina Silva (individual, online)
2. João Santos (individual, offline)
3. Círculo de Estudos (grupo, 4 participantes)
4. Ana Costa (individual, online, 1 não lida)
5. Horta Comunitária (grupo, 3 participantes)
6. Lucas Oliveira (individual, away, vazio)

### Usuários (6)
- user-current (Você)
- user-1: Marina Silva (online)
- user-2: João Santos (offline)
- user-3: Ana Costa (online)
- user-4: Lucas Oliveira (away)
- user-5: Fernanda Dias (online)

### Mensagens Simuladas
- 3 histórias carregadas ao abrir uma conversa
- Timestamps variados (7 dias atrás até agora)
- De diferentes usuários

---

## 🔧 Integração com API Real

### Endpoints Necessários

```http
# Conversas
GET    /api/chats
GET    /api/chats/:conversaId/messages
POST   /api/messages
PATCH  /api/messages/:messageId
DELETE /api/messages/:messageId

# Status
POST   /api/chats/:conversaId/read
GET    /api/users/:userId/status
```

### Atualizar Hook

```typescript
// useChat.ts
const loadMessages = async (conversaId: string) => {
  const response = await fetch(
    `/api/chats/${conversaId}/messages`
  );
  const data = await response.json();
  setMessages(prev => ({
    ...prev,
    [conversaId]: data,
  }));
};

const sendMessage = async ({ conversaId, content }) => {
  const response = await fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ conversaId, content }),
  });
  const newMessage = await response.json();
  // Atualizar estado...
};
```

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| Ctrl/Cmd + Enter | Enviar mensagem |
| Shift + Enter | Quebra de linha |
| Tab | Navegar elementos |
| Escape | Fechar conversa (se suportado) |

---

## 🎯 Limitações Atuais

- Máximo 2 conversas abertas
- Máximo 1000 caracteres por mensagem
- localStorage limitado a ~5-10MB
- Sem suporte a editar/deletar mensagens (pronto para implementar)
- Sem typing indicators
- Sem reações de emoji
- Sem compartilhamento de mídia

---

## 🚀 Próximos Passos

### Essencial (v1.0)
- [ ] Integração com API real
- [ ] Autenticação
- [ ] Busca avançada
- [ ] Criar nova conversa
- [ ] Arquivar conversas

### Importante (v1.1)
- [ ] Editar mensagens
- [ ] Deletar mensagens
- [ ] Typing indicators
- [ ] Notificações
- [ ] Busca dentro da conversa

### Nice to Have (v2.0)
- [ ] Reações de emoji
- [ ] Compartilhamento de mídia
- [ ] Chamadas de voz/vídeo
- [ ] Forwarding
- [ ] Pinned messages
- [ ] Voice messages

---

_Interface de chat completa e funcional!_ 🚀
