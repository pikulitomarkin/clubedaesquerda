# Página de Perfil Público - Clube da Esquerda

Perfil público de usuário com seções de fotos, descrição, bandeiras, interesses, rodas, eventos e homenagens.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Componentes](#componentes)
- [Tipos de Dados](#tipos-de-dados)
- [Como Usar](#como-usar)
- [Fluxo de Dados](#fluxo-de-dados)

## ✨ Funcionalidades

### Header com Fotos
- ✅ Exibição de múltiplas fotos (1-3)
- ✅ Navegação entre fotos via thumbnails
- ✅ Contador de fotos (X/3)
- ✅ Botão de seguir/deixar de seguir
- ✅ Contador de seguidores
- ✅ Data de membro
- ✅ Botão de editar (apenas para proprietário)

### Seção de Bio
- ✅ Descrição com formatação preservada (quebras de linha)
- ✅ Listagem de bandeiras com ícones
- ✅ Listagem de interesses com ícones
- ✅ Design visual elegante
- ✅ Responsivo

### Rodas Conectadas
- ✅ Listagem de rodas que o usuário participa
- ✅ Ícone + nome + descrição
- ✅ Categoria da roda (conversa, estudo, ação, social)
- ✅ Frequência (semanal, quinzenal, mensal)
- ✅ Próxima data
- ✅ Contador de participantes
- ✅ Grid responsivo (2 colunas)
- ✅ Hover effects

### Eventos
- ✅ Listagem de eventos vinculados
- ✅ Separação por status (agendado, em andamento, finalizado)
- ✅ Badge de data
- ✅ Categoria com ícone
- ✅ Status com cor (azul/verde/cinza/vermelho)
- ✅ Localização
- ✅ Descrição truncada
- ✅ Contador de interessados
- ✅ Timeline visual

### Homenagens
- ✅ Listagem de mensagens de apoio
- ✅ Tipos: apoio, reconhecimento, agradecimento, solidariedade
- ✅ Avatar e nome de quem enviou
- ✅ Data da mensagem
- ✅ Expand/collapse para mensagens longas
- ✅ **Toggle de visibilidade** (apenas proprietário vê)
- ✅ Deletar homenagem individual (apenas proprietário)
- ✅ Info visual quando ocultas
- ✅ Contador de visíveis vs totais
- ✅ Botão para compartilhar link de homenagem

## 🏗️ Arquitetura

```
src/
├── types/
│   └── public-profile.ts              # Interfaces
├── data/
│   ├── rodas.ts                       # 6 rodas de exemplo
│   └── eventos.ts                     # 6 eventos de exemplo
├── components/
│   ├── PublicProfileHeader.tsx        # Nome + fotos + info
│   ├── ProfileBioSection.tsx          # Descrição + bandeiras + interesses
│   ├── RodasSection.tsx               # Listagem de rodas
│   ├── EventosSection.tsx             # Listagem de eventos
│   ├── HonorSection.tsx               # Homenagens com toggle
│   └── PublicProfile/
│       └── index.ts                   # Exportações
└── pages/
    └── PublicProfilePage.tsx          # Página completa
```

## 🔧 Componentes

### PublicProfileHeader

Cabeçalho com fotos e informações do perfil.

**Props:**
```typescript
interface PublicProfileHeaderProps {
  name: string;
  photos: string[];
  followersCount?: number;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  isSelf?: boolean;                    // Se é o próprio perfil
}
```

**Características:**
- Foto principal grande
- Thumbnails para navegação
- Contador de fotos
- Seguir/deixar de seguir
- Info de seguidores
- Data de membro
- Botão de editar (apenas self)

---

### ProfileBioSection

Descrição, bandeiras e interesses.

**Props:**
```typescript
interface ProfileBioSectionProps {
  description: string;
  banners: string[];                   // IDs de bandeiras
  interests: string[];                 // IDs de interesses
}
```

**Características:**
- Descrição com line breaks preservados
- Chips de bandeiras com ícones
- Chips de interesses com ícones
- Hover information (tooltips)

---

### RodasSection

Listagem de rodas de conversa.

**Props:**
```typescript
interface RodasSectionProps {
  rodas: Roda[];
  onRodaClick?: (roda: Roda) => void;
}
```

**Características:**
- Grid de 2 colunas
- Ícone da categoria
- Nome e descrição (truncado)
- Frequência
- Próxima data
- Contador de participantes
- Clickable (navegação)
- Hover effects

---

### EventosSection

Listagem de eventos.

**Props:**
```typescript
interface EventosSectionProps {
  eventos: Evento[];
  onEventoClick?: (evento: Evento) => void;
}
```

**Características:**
- Separação por status (abas)
- Badge de data
- Categoria com ícone
- Status com cor
- Localização
- Descrição
- Contador de interessados
- Clickable (navegação)
- Timeline layout

---

### HonorSection

Homenagens com controle de visibilidade.

**Props:**
```typescript
interface HonorSectionProps {
  homenagens: Homenagem[];
  showHomenagens: boolean;             // Controlado pelo usuário
  onToggleVisibility?: (show: boolean) => void;
  isSelf?: boolean;
  onDeleteHomenagem?: (id: string) => void;
}
```

**Características:**
- Toggle de visibilidade (👁️ Visível / 👁️‍🗨️ Oculto)
- Avatar e nome de quem enviou
- Tipo com ícone e cor
- Data da mensagem
- Expand/collapse
- Deletar individual
- Info quando oculto
- Contador visível/total
- Botão para compartilhar link

---

## 📋 Tipos de Dados

### Roda
```typescript
interface Roda {
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
```

### Evento
```typescript
interface Evento {
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
```

### Homenagem
```typescript
interface Homenagem {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  message: string;
  createdAt: Date;
  type: 'apoio' | 'reconhecimento' | 'agradecimento' | 'solidariedade';
  isVisible: boolean;                  // Preferência de cada homenagem
}
```

### PublicUserProfile
```typescript
interface PublicUserProfile {
  id: string;
  name: string;
  avatar?: string;
  photos: string[];
  description: string;
  banners: string[];
  interests: string[];
  rodas: string[];                     // IDs
  eventos: string[];                   // IDs
  homenagens: Homenagem[];
  showHomenagens: boolean;             // Global toggle
  followers?: number;
  followersOf?: number;
  createdAt: Date;
  isFollowing?: boolean;
  isSelf?: boolean;
}
```

## 🚀 Como Usar

### Página Completa

```jsx
import { PublicProfilePage } from '@/pages/PublicProfilePage';

// Ver perfil de outro usuário
<PublicProfilePage userId="user-id-123" isSelf={false} />

// Ver o próprio perfil
<PublicProfilePage userId="my-user-id" isSelf={true} />
```

### Componentes Individuais

```jsx
import {
  PublicProfileHeader,
  ProfileBioSection,
  RodasSection,
  EventosSection,
  HonorSection,
} from '@/components/PublicProfile';

function MyProfile({ profile }) {
  return (
    <div>
      <PublicProfileHeader
        name={profile.name}
        photos={profile.photos}
        followersCount={profile.followers}
        isFollowing={isFollowing}
        onFollowToggle={handleFollow}
        isSelf={isSelf}
      />

      <ProfileBioSection
        description={profile.description}
        banners={profile.banners}
        interests={profile.interests}
      />

      <RodasSection
        rodas={rodas}
        onRodaClick={handleRodaClick}
      />

      <EventosSection
        eventos={eventos}
        onEventoClick={handleEventoClick}
      />

      <HonorSection
        homenagens={profile.homenagens}
        showHomenagens={showHomenagens}
        onToggleVisibility={handleToggleHomenagens}
        isSelf={isSelf}
        onDeleteHomenagem={handleDeleteHomenagem}
      />
    </div>
  );
}
```

## 🔄 Fluxo de Dados

### Carregar Perfil Público

```
1. PublicProfilePage monta
   ↓
2. useEffect dispara carregamento
   ↓
3. Fetch /api/profiles/:userId
   ↓
4. Busca rodas vinculadas
   ↓
5. Busca eventos vinculados
   ↓
6. Busca homenagens com status de visibilidade
   ↓
7. Renderiza seções
```

### Toggle de Homenagens

```
1. Usuário clica botão (👁️ Visível / Oculto)
   ↓
2. onToggleVisibility dispara
   ↓
3. showHomenagens = !showHomenagens
   ↓
4. Salvar preferência no backend
   ↓
5. Componente re-renderiza com/sem homenagens
```

### Seguir/Deixar de Seguir

```
1. Usuário clica "+ Seguir"
   ↓
2. onFollowToggle dispara
   ↓
3. isFollowing = !isFollowing
   ↓
4. followers += 1 ou -1
   ↓
5. POST /api/profiles/:userId/follow
   ↓
6. Botão muda para "✓ Seguindo"
```

## 🎨 Estilos & Temas

### Cores Usadas

| Elemento | Cor | Uso |
|----------|-----|-----|
| Background | Linen | Fundo geral |
| Primária | Terracotta | Botões, destaques |
| Texto | Embroidery Black | Textos principais |
| Bordas | Linen 300 | Elementos divisores |

### Responsividade

| Viewport | Comportamento |
|----------|---------------|
| Mobile | 1 coluna, layout vertical |
| Tablet | 2 colunas para rodas |
| Desktop | 2 colunas para rodas, 3+ para grid de eventos |

## 🔐 Privacidade & Permissões

### Quem pode ver o quê

| Elemento | Público | Proprietário |
|----------|---------|--------------|
| Nome | ✅ | ✅ |
| Fotos | ✅ | ✅ |
| Descrição | ✅ | ✅ |
| Bandeiras | ✅ | ✅ |
| Interesses | ✅ | ✅ |
| Rodas | ✅ | ✅ |
| Eventos | ✅ | ✅ |
| Homenagens | Conforme `showHomenagens` | ✅ (todas) |
| Editar perfil | ❌ | ✅ |
| Deletar homenagem | ❌ | ✅ |
| Toggle visibilidade | ❌ | ✅ |
| Seguir | ✅ | ❌ |

## 🧪 Dados de Exemplo

O componente inclui dados de exemplo:

### Perfil
- **Nome:** Marina Silva
- **Fotos:** 3 imagens
- **Descrição:** Texto sobre ativismo ambiental
- **Bandeiras:** 5 selecionadas
- **Interesses:** 10 selecionados
- **Seguidores:** 284

### Rodas Vinculadas (3)
1. Roda de Conversa - Feminismo e Trabalho
2. Ação Comunitária - Horta Urbana
3. Debate - Reforma Agrária

### Eventos Vinculados (3)
1. 8 de Março - Greve Internacionalista
2. Festival Cultural de Resistência
3. 1º de Maio - Marcha da Classe Trabalhadora

### Homenagens (4)
1. Lucas Santos - Reconhecimento
2. Ana Costa - Agradecimento
3. João Oliveira - Apoio
4. Fernanda Dias - Solidariedade

## 🔧 Customização

### Mudar número de fotos

```jsx
<PublicProfileHeader
  photos={profile.photos.slice(0, 5)} // Até 5 fotos
/>
```

### Mudar categorias de rodas

```typescript
// Em RodasSection.tsx
const categoryLabels = {
  conversa: { label: 'Conversa', icon: '💬' },
  // Adicione mais categorias
};
```

### Mudar tipos de homenagem

```typescript
// Em HonorSection.tsx
const typeLabels = {
  apoio: { label: 'Apoio', icon: '💪', color: 'bg-blue-100' },
  // Adicione mais tipos
};
```

## 📱 Responsividade

### Mobile (< 640px)
- Layout vertical
- Fotos stack verticalmente
- Cards full width
- Grid de rodas: 1 coluna

### Tablet (640-1024px)
- Grid de rodas: 2 colunas
- Cards optimizados
- Thumbnails em linha

### Desktop (> 1024px)
- Grid de rodas: 2 colunas
- Sidebar opcional
- Layout multi-coluna

## 🎯 Fluxo de Usuário

### Ver Perfil Público
```
1. Usuário clica no nome em uma roda/evento
   ↓
2. Navega para /profiles/:username
   ↓
3. PublicProfilePage carrega
   ↓
4. Vê fotos, descrição, rodas, eventos
   ↓
5. Opcionalmente segue ou interage
```

### Gerenciar Próprio Perfil
```
1. Usuário vai para /profile (seu próprio)
   ↓
2. Vê "Editar Perfil" ao invés de "Seguir"
   ↓
3. Vê toggle de "Homenagens Visível/Oculto"
   ↓
4. Pode deletar homenagens individuais
   ↓
5. Pode compartilhar link de homenagens
```

## 📚 Referências

- [Design System](./DESIGN_SYSTEM.md)
- [User Profile CRUD](./USER_PROFILE_CRUD.md)
- [Tipos de Dados](./src/types/public-profile.ts)
- [Dados de Exemplo](./src/data/)

---

_Página de perfil público completa e funcional!_ 🚀
