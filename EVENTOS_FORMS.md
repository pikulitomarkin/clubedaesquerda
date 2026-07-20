# Formulários de Eventos - Clube da Esquerda

Sistema completo de formulários para criação de eventos com 4 tipos diferentes, cada um com campos específicos. Inclui listagem com busca e filtros.

## 📋 Índice

- [Tipos de Eventos](#tipos-de-eventos)
- [Campos Comuns](#campos-comuns)
- [Campos Específicos](#campos-específicos)
- [Componentes](#componentes)
- [Como Usar](#como-usar)
- [Arquitetura](#arquitetura)

## 🎯 Tipos de Eventos

### 1. Presencial 📍
Manifestações, ações, encontros e atividades presenciais.

**Campos Específicos:**
- Local (obrigatório)
- Endereço Completo (obrigatório)
- Capacidade (opcional)

**Exemplo:** "8 de Março - Greve Internacionalista" na Av. Paulista

---

### 2. Online 💻
Lives, webinars, reuniões virtuais em plataformas.

**Campos Específicos:**
- Plataforma (obrigatório): Google Meet, Zoom, Jitsi, Outra
- Link da Reunião (obrigatório)
- Senha ou Token (opcional)

**Exemplo:** "Live: Análise da Conjuntura Política" via Google Meet

---

### 3. Clube (Roda de Conversa) 💬
Espaços de diálogo, trocas comunitárias, rodas temáticas.

**Campos Específicos:**
- Local (obrigatório)
- Recorrência (obrigatório): Nenhuma, Semanal, Quinzenal, Mensal
- Data Final (opcional)
- Tema (opcional)
- Objetivos (opcional, até 200 chars)
- Facilitadores (obrigatório, dinâmico): Adicionar/remover
- Próximos Encontros (gerados automaticamente)

**Exemplo:** "Roda de Conversa - Feminismo e Trabalho" todas as terças 18:30, com Marina Silva e Ana Costa

---

### 4. Análise 📚
Círculos de estudos, análises político-teóricas.

**Campos Específicos:**
- Local (obrigatório)
- Recorrência (obrigatório): Nenhuma, Semanal, Quinzenal, Mensal
- Data Final (opcional)
- Metodologia (opcional, até 200 chars)
- Facilitadores (obrigatório, dinâmico)
- Textos para Preparar (opcional, dinâmico)
- Questões-chave (opcional, dinâmico)
- Próximos Encontros (gerados automaticamente)

**Exemplo:** "Círculo de Estudos - Marxismo Contemporâneo" quinzenalmente com Lucas e prof. Dr. André

---

## 📝 Campos Comuns

Todos os eventos têm esses campos base:

| Campo | Tipo | Tamanho | Obrigatório | Descrição |
|-------|------|---------|-------------|-----------|
| Nome | texto | - | ✅ | Nome do evento |
| Organizador | texto | - | ✅ | Pessoa/grupo organizador |
| Data | data | - | ✅ | Data do evento |
| Horário | hora | - | ✅ | Horário de início |
| Descrição | textarea | 200 chars | ❌ | Descrição breve |
| Imagem de Capa | arquivo | 5MB | ❌ | PNG, JPG, WebP |

---

## 🏗️ Componentes

### EventoFormBase
Componente base com lógica compartilhada.

```typescript
const baseForm = EventoFormBase({
  onSubmit,
  isLoading,
  onCancel,
});
```

**Retorna:**
- `formData`: Dados do formulário
- `handleInputChange`: Handler para inputs
- `handleImageChange`: Upload de imagem
- `imagemPreview`: Preview da imagem
- `remainingChars`: Caracteres restantes

---

### CamposEventoBase
Renderizador de campos comuns em todos os formulários.

```jsx
<CamposEventoBase
  formData={formData}
  onChange={handleInputChange}
  onImageChange={handleImageChange}
  imagemPreview={imagemPreview}
  remainingChars={remainingChars}
/>
```

---

### EventoFormPresencial
Formulário específico para eventos presenciais.

```jsx
<EventoFormPresencial
  onSubmit={handleSubmit}
  isLoading={isLoading}
  onCancel={handleCancel}
/>
```

**Campos adicionais:**
- Local
- Endereço Completo
- Capacidade

---

### EventoFormOnline
Formulário específico para eventos online.

```jsx
<EventoFormOnline
  onSubmit={handleSubmit}
  isLoading={isLoading}
  onCancel={handleCancel}
/>
```

**Campos adicionais:**
- Plataforma (select)
- Link da Reunião
- Senha ou Token

---

### EventoFormClube
Formulário específico para rodas de conversa.

```jsx
<EventoFormClube
  onSubmit={handleSubmit}
  isLoading={isLoading}
  onCancel={handleCancel}
/>
```

**Campos adicionais:**
- Local
- Recorrência
- Data Final
- Tema
- Objetivos
- Facilitadores (dinâmico)

---

### EventoFormAnalise
Formulário específico para análises políticas.

```jsx
<EventoFormAnalise
  onSubmit={handleSubmit}
  isLoading={isLoading}
  onCancel={handleCancel}
/>
```

**Campos adicionais:**
- Local
- Recorrência
- Data Final
- Metodologia
- Facilitadores (dinâmico)
- Textos para Preparar (dinâmico)
- Questões-chave (dinâmico)

---

### EventoModal
Wrapper que encapsula todos os formulários em um modal.

```jsx
<EventoModal
  tipo="presencial"
  isOpen={isOpen}
  onClose={handleClose}
  onSubmit={handleSubmit}
  isLoading={isLoading}
/>
```

**Props:**
- `tipo`: TipoEvento (presencial | online | clube | analise)
- `isOpen`: boolean
- `onClose`: () => void
- `onSubmit`: (data) => Promise<void>
- `isLoading`: boolean

---

### EventoList
Listagem de eventos com busca e filtros.

```jsx
<EventoList
  eventos={eventos}
  onEventoClick={handleEventoClick}
  onNovoEvento={handleNovoEvento}
/>
```

**Funcionalidades:**
- Busca por nome
- Filtro por tipo
- Checkbox "Apenas ativos"
- Botões de ação rápida
- Cards com preview

---

## 🚀 Como Usar

### Página Completa

```jsx
import { EventosPage } from '@/pages/EventosPage';

export default function App() {
  return <EventosPage />;
}
```

### Componentes Individuais

```jsx
import { EventoModal, EventoList } from '@/components/Eventos';
import { useState } from 'react';

function MyEventosApp() {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('presencial');
  const [eventos, setEventos] = useState([]);

  const handleNovoEvento = (tipo) => {
    setTipoSelecionado(tipo);
    setModalAberto(true);
  };

  const handleSubmit = async (data) => {
    // Criar evento
    const novoEvento = { ...data, id: Date.now() };
    setEventos([...eventos, novoEvento]);
    setModalAberto(false);
  };

  return (
    <>
      <EventoList
        eventos={eventos}
        onNovoEvento={handleNovoEvento}
      />

      <EventoModal
        tipo={tipoSelecionado}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
```

---

## 📊 Estrutura de Dados

### Evento Base
```typescript
{
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
```

### Recorrência
```typescript
type Recorrencia = 'nenhuma' | 'semanal' | 'quinzenal' | 'mensal';
```

### Filtros
```typescript
{
  tipo?: TipoEvento;
  busca?: string;
  dataInicio?: Date;
  dataFim?: Date;
  apenas_ativos?: boolean;
}
```

---

## 🎨 Layout & UX

### Modal Header
- Ícone do tipo
- Título e descrição
- Botão fechar

### Formulários
- Campos base primeiro
- Linha separadora
- Campos específicos
- Validação inline
- Botões sticky no bottom

### Lista
- Cards com imagem, nome, organizador
- Tags de tipo com cores
- Info de data, horário, local
- Hover effects
- Filtros sticky top

---

## ✅ Validações

### Campos Obrigatórios
- Nome, organizador, data, horário sempre validados
- Cada tipo tem validações adicionais

### Presencial
- Local e endereço obrigatórios

### Online
- Link da reunião obrigatório
- URL válida (try/catch)
- Plataforma obrigatória

### Clube/Análise
- Local obrigatório
- Facilitadores sem nomes vazios
- Recorrência obrigatória

### Imagem
- Máximo 5MB
- Tipos: PNG, JPG, WebP
- Convertida para Base64

### Descrição
- Máximo 200 caracteres
- Contador em tempo real

---

## 🔄 Fluxo de Dados

```
1. Usuário clica "Novo Evento" de um tipo
   ↓
2. Modal abre com formulário correto
   ↓
3. Preenche campos (validação inline)
   ↓
4. Clica "Criar Evento"
   ↓
5. Enviar para handleSubmit
   ↓
6. Simula delay de 1s
   ↓
7. Novo evento criado
   ↓
8. Modal fecha
   ↓
9. Notificação de sucesso
   ↓
10. Lista atualiza
```

---

## 🎯 Dados de Exemplo

### Presencial
- 8 de Março - Greve Internacionalista
- Seminário: Imperialismos Contemporâneos

### Online
- Live: Análise da Conjuntura Política
- Webinar: Direitos LGBTQ+ Globalmente

### Clube
- Roda de Conversa - Feminismo e Trabalho (semanal)
- Ação Comunitária - Horta Urbana (semanal)

### Análise
- Círculo de Estudos - Marxismo Contemporâneo (quinzenal)
- Análise Política - Eleições e Organização (mensal)

---

## 🚀 Próximos Passos

### Essencial
- [ ] Integração com API real
- [ ] Upload de imagem para servidor
- [ ] Persistência do histórico
- [ ] Notificações de novo evento
- [ ] Editar/deletar eventos

### Importante
- [ ] Busca avançada por data
- [ ] Exportar para calendário
- [ ] Compartilhar evento
- [ ] Inscrever-se em evento
- [ ] Enviar lembrete

### Nice to Have
- [ ] Importar eventos do Google Calendar
- [ ] Mapa interativo para presenciais
- [ ] Videochat para online
- [ ] Arquivo de eventos passados
- [ ] Votação para próximos temas

---

_Sistema de eventos completo e funcional!_ 🎉
