# Design System - Clube da Esquerda

Sistema de design completo em Tailwind CSS e CSS customizado, baseado na estética de bordado do Clube da Esquerda.

## 📋 Índice

- [Estrutura](#estrutura)
- [Tokens de Design](#tokens-de-design)
- [Tipografia](#tipografia)
- [Cores](#cores)
- [Componentes](#componentes)
- [Como Usar](#como-usar)
- [Customização](#customização)

## 🏗️ Estrutura

```
src/
├── components/
│   ├── EmbroideryButton.tsx      # Botão principal parametrizável
│   └── EmbroideryLogo.tsx        # Logo com bastidor de bordado
├── styles/
│   ├── design-system.css         # Estilos customizados e efeitos
│   └── design-tokens.ts          # Tokens TypeScript para uso em código
```

## 🎨 Tokens de Design

### Arquivo Principal

**`tailwind.config.ts`** - Configuração Tailwind com todos os tokens:
- Cores (linen, terracotta, embroidery)
- Tipografia (fonts, sizes)
- Efeitos (shadows, animations)
- Background patterns

**`src/styles/design-tokens.ts`** - Tokens exportáveis para TypeScript:
```typescript
import { colors, typography, shadows } from '@/styles/design-tokens';

// Uso em componentes
const bgColor = colors.linen.sand;
const headingFont = typography.fonts.heading;
```

## 📝 Tipografia

### Fontes

| Uso | Fonte | Tamanho | Peso |
|-----|-------|---------|------|
| Heading/Títulos | Caveat | 2.5rem | 700 |
| Subheading | Caveat | 1.5rem | 400 |
| Body/Corpo | System Font | 12px | 400 |
| Buttons/Bordado | Dancing Script | 1rem | 700 |

### Classes CSS

```html
<!-- Heading -->
<h1 class="font-heading text-5xl">Título Principal</h1>

<!-- Subheading -->
<h2 class="font-subheading text-2xl">Subtítulo</h2>

<!-- Body -->
<p class="font-body">Parágrafo normal</p>

<!-- Embroidery -->
<span class="font-embroidery">Texto bordado</span>
```

## 🎨 Cores

### Paleta Primária

#### Linen (Linho)
```
bg-linen-50    #faf8f6
bg-linen-100   #f5f2ed
bg-linen-200   #ebe5db
bg-linen-300   #e1d9ca
bg-linen-400   #d7ccb8
bg-linen-500   #cdbfa7  ← Primária (Sand)
bg-linen-600   #b8a78a
bg-linen-700   #a38f6d
bg-linen-800   #8e7750
bg-linen-900   #7a6343
```

#### Terracotta
```
bg-terracotta-50   #fdf6f2
bg-terracotta-100  #fceae1
bg-terracotta-200  #f8d0ba
bg-terracotta-300  #f5b692
bg-terracotta-400  #f19c6a
bg-terracotta-500  #ed8242  ← Primária (Botões)
bg-terracotta-600  #d86d2e
bg-terracotta-700  #c25826
bg-terracotta-800  #9c461f
bg-terracotta-900  #7a341a
```

#### Embroidery
```
text-embroidery-black  #1a1a1a
text-embroidery-dark   #3a3a3a
text-embroidery-gray   #5a5a5a
```

### Cores de Linha (Thread)

Para personalizar a cor do texto bordado nos botões:

| Cor | Valor | Classe |
|-----|-------|--------|
| Preta | #1a1a1a | `embroidery-thread-black` |
| Branca | #ffffff | `embroidery-thread-white` |
| Vermelha | #d32f2f | `embroidery-thread-red` |
| Dourada | #f9a825 | `embroidery-thread-gold` |
| Verde | #2e7d32 | `embroidery-thread-green` |
| Azul | #1976d2 | `embroidery-thread-blue` |

### Fundo com Textura de Linho

```html
<div class="bg-linen-texture min-h-screen">
  <!-- Conteúdo com textura de linho -->
</div>
```

## 🔘 Componentes

### EmbroideryButton

Botão parametrizável com efeito 3D e cores de linha customizáveis.

**Props:**

```typescript
interface EmbroideryButtonProps {
  children: React.ReactNode;
  threadColor?: 'black' | 'white' | 'red' | 'gold' | 'green' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  disabled?: boolean;
  // ... HTMLButtonAttributes
}
```

**Exemplos:**

```jsx
// Básico
<EmbroideryButton>Clique aqui</EmbroideryButton>

// Com cor de linha
<EmbroideryButton threadColor="gold">Premium</EmbroideryButton>

// Tamanho grande com linha vermelha
<EmbroideryButton size="lg" threadColor="red">Importante</EmbroideryButton>

// Secundário com linha verde
<EmbroideryButton variant="secondary" threadColor="green">Aprovado</EmbroideryButton>

// Em carregamento
<EmbroideryButton isLoading={isLoading}>Enviar</EmbroideryButton>

// Desabilitado
<EmbroideryButton disabled>Indisponível</EmbroideryButton>
```

### EmbroideryLogo

Logo com bastidor de bordado para marca.

**Props:**

```typescript
interface EmbroideryLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Exemplos:**

```jsx
<EmbroideryLogo size="sm" />  {/* w-24 h-24 */}
<EmbroideryLogo size="md" />  {/* w-40 h-40 */}
<EmbroideryLogo size="lg" />  {/* w-56 h-56 */}
```

## 🚀 Como Usar

Este design system vive dentro de `apps/web` (Next.js App Router).
`app/layout.tsx` já importa `src/styles/design-system.css` globalmente.

```jsx
import { EmbroideryButton } from '@/components/EmbroideryButton';
import { EmbroideryLogo } from '@/components/EmbroideryLogo';
```

Demonstração completa: rota `/design-system` (`app/design-system/page.tsx`).

## 🎯 Customização

### Alterar Cores Primárias

Edite `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      linen: {
        500: '#sua-cor-linho', // Altere aqui
      },
      terracotta: {
        500: '#sua-cor-terracota', // Altere aqui
      },
    },
  },
}
```

## ✨ Features

✅ Paleta de cores harmoniosa (linho + terracota)
✅ Tipografia elegante (manuscrita + body)
✅ Botão 3D com 6 cores de linha customizáveis
✅ Efeitos de bordado e textura de linho
✅ Logo com bastidor
✅ Suporte a modo escuro
✅ Acessibilidade (focus states, reduced motion)
✅ Tokens reutilizáveis (CSS + TypeScript)
