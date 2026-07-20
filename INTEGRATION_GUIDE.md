# Guia de Integração - Clube da Esquerda

Instruções completas para integrar o design system e o CRUD de perfil ao seu projeto.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Setup Inicial](#setup-inicial)
- [Integração de Componentes](#integração-de-componentes)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
- [Troubleshooting](#troubleshooting)

## ✅ Pré-requisitos

### Dependências Obrigatórias
```bash
npm install tailwindcss postcss autoprefixer
npm install -D typescript @types/react @types/react-dom
```

### Versões Recomendadas
- React 18+
- TypeScript 5+
- Tailwind CSS 3.3+
- Node.js 18+

## 🚀 Setup Inicial

### 1. Copiar Arquivos para seu Projeto

```bash
# Copiar arquivos do design system
cp tailwind.config.ts your-project/
cp src/styles/design-system.css your-project/src/styles/
cp src/styles/design-tokens.ts your-project/src/styles/

# Copiar componentes do design system
cp src/components/EmbroideryButton.tsx your-project/src/components/
cp src/components/EmbroideryLogo.tsx your-project/src/components/

# Copiar componentes do CRUD
cp src/components/PhotoUpload.tsx your-project/src/components/
cp src/components/DescriptionInput.tsx your-project/src/components/
cp src/components/BannerSelector.tsx your-project/src/components/
cp src/components/InterestSelector.tsx your-project/src/components/
cp src/components/MultiSelectButton.tsx your-project/src/components/

# Copiar dados
cp -r src/data your-project/src/

# Copiar types
cp -r src/types your-project/src/

# Copiar hooks
cp -r src/hooks your-project/src/

# Copiar páginas
cp src/pages/UserProfilePage.tsx your-project/src/pages/
cp src/pages/DesignSystemShowcase.tsx your-project/src/pages/
cp src/pages/ProfileCrudDemo.tsx your-project/src/pages/
```

### 2. Configurar Tailwind CSS

Seu `tailwind.config.ts` já existe. Certifique-se de que ele está sendo usado:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import defaultConfig from './tailwind.config';

const config: Config = {
  ...defaultConfig,
  // Suas customizações adicionais aqui
};

export default config;
```

### 3. Importar CSS Global

No seu arquivo principal (App.tsx ou main.tsx):

```typescript
// src/main.tsx ou src/App.tsx
import './styles/design-system.css';  // Adicione esta linha
import './index.css';                  // Seu CSS global
```

### 4. Configurar Rotas (Se usando Router)

```typescript
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { DesignSystemShowcase } from '@/pages/DesignSystemShowcase';
import { ProfileCrudDemo } from '@/pages/ProfileCrudDemo';

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/design-system" element={<DesignSystemShowcase />} />
        <Route path="/profile-demo" element={<ProfileCrudDemo />} />
      </Routes>
    </Router>
  );
}
```

## 🔧 Integração de Componentes

### Usar Página Completa

```jsx
import { UserProfilePage } from '@/pages/UserProfilePage';

export default function App() {
  return (
    <div>
      <header>Seu Header</header>
      <UserProfilePage />
      <footer>Seu Footer</footer>
    </div>
  );
}
```

### Usar Componentes Individuais

```jsx
import {
  PhotoUpload,
  DescriptionInput,
  BannerSelector,
  InterestSelector,
} from '@/components';
import { useProfile } from '@/hooks/useProfile';

export function MyCustomForm() {
  const { profile, updateField } = useProfile();

  return (
    <div className="space-y-6">
      <PhotoUpload
        photos={profile.photos}
        onPhotosChange={(photos) => updateField('photos', photos)}
      />

      <DescriptionInput
        value={profile.description}
        onChange={(desc) => updateField('description', desc)}
      />

      <BannerSelector
        selectedBanners={profile.banners}
        onChange={(banners) => updateField('banners', banners)}
      />

      <InterestSelector
        selectedInterests={profile.interests}
        onChange={(interests) => updateField('interests', interests)}
      />
    </div>
  );
}
```

### Usar Botão do Design System

```jsx
import { EmbroideryButton } from '@/components';

export function MyButtons() {
  return (
    <div className="space-x-4">
      <EmbroideryButton>Clique aqui</EmbroideryButton>

      <EmbroideryButton size="lg" threadColor="gold">
        Premium
      </EmbroideryButton>

      <EmbroideryButton variant="secondary" threadColor="green">
        Aprovado
      </EmbroideryButton>

      <EmbroideryButton isLoading={true}>
        Carregando...
      </EmbroideryButton>
    </div>
  );
}
```

## 📁 Estrutura de Pastas

Após a cópia, sua estrutura será:

```
seu-projeto/
├── src/
│   ├── components/
│   │   ├── EmbroideryButton.tsx
│   │   ├── EmbroideryLogo.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── DescriptionInput.tsx
│   │   ├── BannerSelector.tsx
│   │   ├── InterestSelector.tsx
│   │   ├── MultiSelectButton.tsx
│   │   └── index.ts
│   ├── data/
│   │   ├── banners.ts
│   │   └── interests.ts
│   ├── types/
│   │   └── profile.ts
│   ├── hooks/
│   │   └── useProfile.ts
│   ├── pages/
│   │   ├── UserProfilePage.tsx
│   │   ├── DesignSystemShowcase.tsx
│   │   └── ProfileCrudDemo.tsx
│   ├── styles/
│   │   ├── design-system.css
│   │   └── design-tokens.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.ts (exportações)
├── tailwind.config.ts
└── package.json
```

## 🛠️ Ambiente de Desenvolvimento

### Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

### Verificar Tipos TypeScript

```bash
npx tsc --noEmit
```

### Build para Produção

```bash
npm run build
```

### Lint (se configurado)

```bash
npm run lint
```

## 📖 Como Testar

### 1. Teste o Design System

Acesse `http://localhost:5173/design-system`:

- Veja tipografia, cores, componentes
- Teste diferentes estados dos botões
- Visualize o design completo

### 2. Teste o CRUD Completo

Acesse `http://localhost:5173/profile`:

- Clique em "Editar"
- Teste upload de fotos (drag & drop)
- Teste descrição com contador
- Selecione bandeiras e interesses
- Salve e visualize no modo view

### 3. Teste Individual de Componentes

Crie uma página de testes:

```jsx
// src/pages/ComponentsTest.tsx
import { PhotoUpload } from '@/components/PhotoUpload';
import { useState } from 'react';

export function ComponentsTest() {
  const [photos, setPhotos] = useState<string[]>([]);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="font-heading text-3xl mb-8">Teste de Componentes</h1>

      <div className="bg-white p-6 rounded-lg mb-8">
        <PhotoUpload
          photos={photos}
          onPhotosChange={setPhotos}
        />
      </div>

      {/* Adicione mais componentes para testar */}
    </div>
  );
}
```

## 🔌 Integrar com Backend

### Exemplo com Node.js/Express

```typescript
// Backend API endpoints
POST   /api/profiles              // Criar novo perfil
GET    /api/profiles/:id          // Obter perfil
PATCH  /api/profiles/:id          // Atualizar perfil
DELETE /api/profiles/:id          // Deletar perfil

// Atualizar useProfile.ts
const response = await fetch(`/api/profiles/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### Exemplo com TypeScript

```typescript
// src/services/profileService.ts
import type { UserProfile, CreateUserProfileDTO } from '@/types/profile';

export const profileService = {
  async create(data: CreateUserProfileDTO): Promise<UserProfile> {
    const response = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async update(id: string, data: Partial<UserProfile>) {
    const response = await fetch(`/api/profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async get(id: string): Promise<UserProfile> {
    const response = await fetch(`/api/profiles/${id}`);
    return response.json();
  },

  async delete(id: string): Promise<void> {
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
  },
};
```

### Atualizar Hook com API Real

```typescript
// src/hooks/useProfile.ts
import { profileService } from '@/services/profileService';

export const useProfile = () => {
  // ... estado

  const updateProfile = useCallback(async (data: UpdateUserProfileDTO) => {
    if (!profile) return null;

    setIsLoading(true);
    setError('');

    try {
      // Usar API real em vez de simulado
      const updatedProfile = await profileService.update(profile.id, data);
      setProfile(updatedProfile);
      setIsDirty(false);
      return updatedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // ... resto do hook
};
```

## 🌐 Ambiente de Produção

### Otimizações Recomendadas

1. **Compressão de Imagens**
   - Converter base64 para URLs de servidor
   - Usar CDN para imagens

2. **Code Splitting**
   - Lazy load páginas de perfil
   ```tsx
   const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'));
   ```

3. **Caching**
   - Cache de perfil com SWR ou React Query
   - Cache local com localStorage

4. **Performance**
   - Usar imagens WebP
   - Lazy load de componentes pesados
   - Memoização de componentes

## 🐛 Troubleshooting

### Problema: Estilos não estão sendo aplicados

**Solução:**
```typescript
// Verifique se design-system.css está importado
import '@/styles/design-system.css';

// Verifique se tailwind.config.ts está correto
// Rode: npm run build
```

### Problema: TypeScript complaining sobre tipos

**Solução:**
```bash
# Certifique-se de ter as dependências @types
npm install --save-dev @types/react @types/react-dom

# Rode type check
npx tsc --noEmit
```

### Problema: Fotos não salvam

**Solução:**
- Verificar tamanho máximo do localStorage (5-10MB)
- Integrar com API para armazenamento em servidor
- Usar CDN ou cloud storage (S3, etc)

### Problema: Componentes não renderizam

**Solução:**
```typescript
// Verificar importações
import type { UserProfile } from '@/types/profile';
import { PhotoUpload } from '@/components/PhotoUpload';

// Verificar paths em tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 📚 Documentação Adicional

- [Design System](./DESIGN_SYSTEM.md) - Sistema de design completo
- [User Profile CRUD](./USER_PROFILE_CRUD.md) - CRUD de perfil detalhado
- [Design System Summary](./DESIGN_SYSTEM_SUMMARY.txt) - Resumo visual
- [User Profile Summary](./USER_PROFILE_SUMMARY.txt) - Resumo do CRUD

## 🤝 Suporte

Para dúvidas ou issues:
1. Consulte a documentação
2. Verifique os exemplos em `ProfileCrudDemo.tsx`
3. Execute os testes de componentes
4. Verifique o console do navegador

## ✅ Checklist de Integração

- [ ] React 18+ instalado
- [ ] TypeScript configurado
- [ ] Tailwind CSS configurado
- [ ] Arquivos copiados para o projeto
- [ ] `design-system.css` importado
- [ ] `tailwind.config.ts` atualizado
- [ ] Rutas configuradas (se router)
- [ ] Componentes podem ser importados
- [ ] Página de perfil renderiza
- [ ] Testes básicos passam
- [ ] Build sem erros
