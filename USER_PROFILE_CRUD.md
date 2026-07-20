# CRUD de Perfil de Usuário

Sistema completo para gerenciar perfis de usuários com upload de fotos, descrição, bandeiras e interesses.

## 📋 Índice

- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Componentes](#componentes)
- [Como Usar](#como-usar)
- [Tipos de Dados](#tipos-de-dados)
- [API](#api)

## ✨ Funcionalidades

### Upload de Fotos
- ✅ Até **3 fotos** por perfil
- ✅ Upload via clique ou drag & drop
- ✅ Preview em tempo real
- ✅ Validações: tipo, tamanho (5MB máx)
- ✅ Remover fotos individuais
- ✅ Armazenamento em Base64 (ou integrar com servidor)

### Descrição
- ✅ Até **600 caracteres**
- ✅ Contador de caracteres em tempo real
- ✅ Barra de progresso visual
- ✅ Avisos quando próximo do limite
- ✅ Suporte a quebras de linha
- ✅ Botão para limpar

### Bandeiras (21 opções)
Com ícones e descrições:
- LGBTQ+
- Trans
- Não-binário
- Feminismo
- Anti-machismo
- Antirracismo
- Indígena
- Pessoas com Deficiência
- Neurodiversidade
- Socialismo
- Comunismo
- Anarquismo
- Movimento Operário
- Questão Agrária
- Ambientalismo
- Antimilitarismo
- Solidariedade Internacional
- Descolonização
- Anticapitalismo
- Secularismo
- Esquerda Cultural

**Limite:** 8 bandeiras por perfil (configurável)

### Interesses (25 opções)
Organizados por categorias:

#### Ideologia (6)
- Política 🏛️
- Economia Política 💰
- Estudos de Gênero 👯
- Meio Ambiente 🌱
- Justiça Social ⚖️
- Direitos Humanos 🕊️

#### Educação (6)
- História 📚
- Filosofia 🤔
- Sociologia 👥
- Tecnologia 💻
- Estudos de Gênero 👯
- Espiritualidade 🙏

#### Ação (3)
- Ativismo ✊
- Trabalho Comunitário 🤲
- Educação 🎓
- Saúde Pública ⚕️

#### Cultura (4)
- Artes 🎨
- Música 🎵
- Literatura 📖
- Cinema 🎬
- Teatro 🎭

#### Lazer (3)
- Esportes ⚽
- Gastronomia 🍲
- Viagens ✈️

#### Pessoal (2)
- Espiritualidade 🙏
- Saúde Mental 💜

#### Social (1)
- Networking 🔗

**Limite:** 12 interesses por perfil (configurável)

## 🏗️ Arquitetura

```
src/
├── types/
│   └── profile.ts                 # Interfaces TypeScript
├── data/
│   ├── banners.ts                 # 21 bandeiras com ícones
│   └── interests.ts               # 25 interesses com categorias
├── hooks/
│   └── useProfile.ts              # Hook para gerenciar perfil
├── components/
│   ├── PhotoUpload.tsx            # Upload de fotos
│   ├── DescriptionInput.tsx       # Input de descrição
│   ├── BannerSelector.tsx         # Seleção de bandeiras
│   ├── InterestSelector.tsx       # Seleção de interesses
│   ├── MultiSelectButton.tsx      # Componente reutilizável
│   └── index.ts                   # Exportações
└── pages/
    └── UserProfilePage.tsx        # Página principal CRUD
```

## 🔧 Componentes

### PhotoUpload

Upload de fotos com drag & drop.

**Props:**
```typescript
interface PhotoUploadProps {
  photos: string[];                    // Array de fotos em Base64
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;                  // Padrão: 3
  maxFileSize?: number;                // Em MB, padrão: 5
}
```

**Exemplo:**
```jsx
<PhotoUpload
  photos={profile.photos}
  onPhotosChange={(photos) => updateField('photos', photos)}
  maxPhotos={3}
  maxFileSize={5}
/>
```

**Funcionalidades:**
- Validação de tipo e tamanho
- Preview em grid
- Remover fotos ao hover
- Drag & drop
- Contador de fotos

---

### DescriptionInput

Input de descrição com limite de caracteres.

**Props:**
```typescript
interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  maxCharacters?: number;              // Padrão: 600
  placeholder?: string;
}
```

**Exemplo:**
```jsx
<DescriptionInput
  value={profile.description}
  onChange={(desc) => updateField('description', desc)}
  maxCharacters={600}
/>
```

**Funcionalidades:**
- Contador em tempo real
- Barra de progresso
- Cores de aviso (amarelo/vermelho)
- Suporte a quebras de linha (Ctrl+Enter)
- Botão para limpar

---

### BannerSelector

Seleção múltipla de bandeiras.

**Props:**
```typescript
interface BannerSelectorProps {
  selectedBanners: string[];           // IDs das bandeiras selecionadas
  onChange: (banners: string[]) => void;
  maxSelections?: number;              // Padrão: 8
}
```

**Exemplo:**
```jsx
<BannerSelector
  selectedBanners={profile.banners}
  onChange={(banners) => updateField('banners', banners)}
  maxSelections={8}
/>
```

**Funcionalidades:**
- Grid de botões com ícone + nome
- Indicador visual de seleção (checkmark)
- Limite máximo configurável
- Exibir selecionadas em chips
- Remover individual via X

---

### InterestSelector

Seleção múltipla de interesses com filtro por categoria.

**Props:**
```typescript
interface InterestSelectorProps {
  selectedInterests: string[];         // IDs dos interesses
  onChange: (interests: string[]) => void;
  maxSelections?: number;              // Padrão: 12
}
```

**Exemplo:**
```jsx
<InterestSelector
  selectedInterests={profile.interests}
  onChange={(interests) => updateField('interests', interests)}
  maxSelections={12}
/>
```

**Funcionalidades:**
- Filtro por categoria (abas)
- Grid responsivo
- Indicador visual de seleção
- Limite máximo
- Exibir selecionados em chips

---

### MultiSelectButton

Componente reutilizável para seleção (usado por Banner/Interest).

**Props:**
```typescript
interface MultiSelectButtonProps {
  item: {
    id: string;
    name: string;
    icon: string;
  };
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  className?: string;
}
```

**Características:**
- Ícone grande + nome abaixo
- Checkmark quando selecionado
- Bordas dashed
- Estados visuais (hover, selected)
- Responsivo

## 🪝 Hook: useProfile

Gerencia estado e operações do perfil.

**Interface:**
```typescript
interface UseProfileResult {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  isLoading: boolean;
  error: string;
  isDirty: boolean;                   // Se tem mudanças não salvas
  createProfile: (data: CreateUserProfileDTO) => Promise<UserProfile>;
  updateProfile: (data: UpdateUserProfileDTO) => Promise<UserProfile>;
  updateField: <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => void;
  loadProfile: (userId: string) => Promise<UserProfile>;
  deleteProfile: () => Promise<boolean>;
  reset: () => void;
}
```

**Exemplo:**
```jsx
const { profile, isDirty, updateField, updateProfile } = useProfile();

// Atualizar campo individual
updateField('description', 'Nova descrição');

// Salvar tudo
await updateProfile({
  description: profile.description,
  banners: profile.banners,
  interests: profile.interests,
});
```

## 📋 Tipos de Dados

### UserProfile
```typescript
interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  photos: string[];                   // Base64 strings
  description: string;                // Até 600 chars
  banners: string[];                  // IDs de bandeiras
  interests: string[];                // IDs de interesses
  createdAt: Date;
  updatedAt: Date;
}
```

### Banner
```typescript
interface Banner {
  id: string;
  name: string;
  icon: string;                       // Emoji
  description?: string;
}
```

### Interest
```typescript
interface Interest {
  id: string;
  name: string;
  icon: string;                       // Emoji
  category?: string;
}
```

## 🚀 Como Usar

### 1. Importar na sua página

```jsx
import { UserProfilePage } from '@/pages/UserProfilePage';

function App() {
  return <UserProfilePage />;
}
```

### 2. Usar componentes individuais

```jsx
import { PhotoUpload } from '@/components/PhotoUpload';
import { BannerSelector } from '@/components/BannerSelector';
import { useProfile } from '@/hooks/useProfile';

function MyProfileForm() {
  const { profile, updateField } = useProfile();

  return (
    <div>
      <PhotoUpload
        photos={profile.photos}
        onPhotosChange={(p) => updateField('photos', p)}
      />
      <BannerSelector
        selectedBanners={profile.banners}
        onChange={(b) => updateField('banners', b)}
      />
    </div>
  );
}
```

### 3. Personalizar dados

**Adicionar nova bandeira** (`src/data/banners.ts`):
```typescript
{
  id: 'my-banner',
  name: 'Minha Causa',
  icon: '🎯',
  description: 'Descrição',
}
```

**Adicionar novo interesse** (`src/data/interests.ts`):
```typescript
{
  id: 'my-interest',
  name: 'Meu Interesse',
  icon: '⭐',
  category: 'Minha Categoria',
}
```

### 4. Integrar com API

No `useProfile.ts`, substituir as chamadas simuladas:

```typescript
// Antes (simulado)
const newProfile: UserProfile = { ... };
setProfile(newProfile);

// Depois (real)
const response = await fetch('/api/profiles', {
  method: 'POST',
  body: JSON.stringify(data),
});
const newProfile = await response.json();
setProfile(newProfile);
```

## 🔄 Fluxo

### Criar Perfil
```
User clicks "New Profile"
  ↓
createProfile({ name, description?, banners?, interests? })
  ↓
API POST /profiles
  ↓
setProfile(newProfile)
  ↓
Show profile in view mode
```

### Editar Perfil
```
User clicks "Edit"
  ↓
Mode = 'edit'
  ↓
User modifies fields via updateField()
  ↓
isDirty = true
  ↓
User clicks "Save"
  ↓
updateProfile({ ...changes })
  ↓
API PATCH /profiles/:id
  ↓
Mode = 'view'
  ↓
Show success notification
```

### Deletar Perfil
```
User clicks "Delete"
  ↓
deleteProfile()
  ↓
API DELETE /profiles/:id
  ↓
setProfile(null)
  ↓
Redirect to home
```

## 🎨 Personalizações

### Mudar cores dos botões

No componente `MultiSelectButton.tsx`:
```jsx
${
  isSelected
    ? 'border-terracotta-500 bg-terracotta-50'    // Altere aqui
    : 'border-linen-400 bg-white'                  // Ou aqui
}
```

### Mudar limites de seleção

Na página `UserProfilePage.tsx`:
```jsx
<BannerSelector maxSelections={10} />      {/* Era 8 */}
<InterestSelector maxSelections={15} />   {/* Era 12 */}
```

### Mudar tamanho máximo de foto

No componente `PhotoUpload.tsx`:
```jsx
<PhotoUpload maxFileSize={10} />            {/* 10MB ao invés de 5MB */}
```

## 📱 Responsividade

Todos os componentes são responsivos:
- **Mobile:** 2 colunas para MultiSelect
- **Tablet:** 3-4 colunas
- **Desktop:** 4-6 colunas

Ajustado via grid Tailwind:
```jsx
className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
```

## ♿ Acessibilidade

- ✅ Inputs com labels
- ✅ ARIA labels em botões
- ✅ Focus states visíveis
- ✅ Teclado navegável
- ✅ Cores de aviso (não apenas visuais)
- ✅ Alt text em imagens

## 🐛 Troubleshooting

### Fotos não salvam
Verifique se há espaço suficiente no localStorage (5-10MB máx).
**Solução:** Integrar com servidor/API para armazenamento.

### Limites de seleção não funcionam
Verifique os props `maxSelections` nos componentes.

### Modo edit não mostra mudanças
Verifique se `updateField` está sendo chamado corretamente.

## 📚 Referências

- [Design System](./DESIGN_SYSTEM.md) - Componentes base
- [Types](./src/types/profile.ts) - Interfaces
- [Data](./src/data/) - Bandeiras e Interesses
- [Components](./src/components/) - Componentes React

