# Roda CRUD Forms - Detailed Documentation

## RodaForm Component

### Purpose
Creates and edits discussion circles (Rodas) with comprehensive metadata, media files, and music playlist configuration.

### Location
`src/components/RodaForm.tsx`

### Props Interface
```typescript
interface RodaFormProps {
  onSubmit: (data: CreateRodaDTO) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}
```

### Form Sections

#### 1. Informações Básicas
- **Nome da Roda** (required)
  - Text input with placeholder "Ex: Feminismo e Trabalho"
  - Validates non-empty trim()
  
- **Descrição** (required)
  - Textarea with 500 character limit
  - Real-time character counter: "current/500"
  - Resize disabled for consistent layout
  - Placeholder: "Descrição breve da roda..."

- **Categoria** (optional)
  - Text input for organization
  - Placeholder: "Ex: Educação"
  - Stored as string (no predefined list)

- **Tags** (optional)
  - Comma-separated text input
  - Example: "tag1, tag2, tag3"
  - Parsed and split on form submission
  - Trimmed and cleaned of whitespace

#### 2. Mídia Section

- **Imagem de Capa** (optional)
  - File input restricted to image/* files
  - Max file size: 10MB
  - Converted to Base64 on selection
  - Preview thumbnail displayed below input
  - Error displayed if file exceeds 10MB

- **GIF em Loop** (optional)
  - File input accepts image/* and .gif files
  - Max file size: 10MB
  - Converted to Base64 on selection
  - Preview with animate-pulse effect
  - Separate upload from capa image

#### 3. Músicas Section
**Exactly 3 music slots** (fixed count, not dynamic)

For each music slot (1, 2, 3):
- **Plataforma** (select dropdown)
  - Options: YouTube, Spotify, SoundCloud, Outra
  - Defaults: 1st = youtube, 2nd = spotify, 3rd = youtube
  - Stored as: 'spotify' | 'youtube' | 'soundcloud' | 'outra'

- **Título** (text input)
  - Placeholder: "Título da música"
  - Optional but recommended

- **Link** (URL input)
  - Type="url" for basic validation
  - Placeholder: "https://..."
  - Validates that at least 1 link has a URL on submit

### Validation Rules

**Errors thrown/displayed:**
1. Nome and descricao both required (trim check)
   - Message: "Nome e descrição são obrigatórios"
2. At least 1 music URL required
   - Message: "Adicione pelo menos um link de música"
3. Image file size > 10MB
   - Message: "Imagem não pode ser maior que 10MB"

### Data Transformation

**On submit**, the form converts to CreateRodaDTO:
```typescript
{
  nome: string,
  descricao: string,
  imagemCapa: string | undefined (Base64),
  gifLoop: string | undefined (Base64),
  musicas: [
    { id: string, url: string, titulo?: string, plataforma: string }
  ],
  tags: string[] | undefined,
  categoria: string | undefined
}
```

### UI/UX Details

- **Loading State**: Submit button shows "Criando..." when isSubmitting or isLoading
- **Sticky Footer**: Button row stays visible during scroll with white background
- **Scrollable Content**: max-h-96 overflow-y-auto with pr-2 padding right
- **Color Scheme**:
  - Borders: border-linen-300
  - Focus: border-terracotta-400
  - Buttons: terracotta-500/700 (submit), linen-300/600 (cancel)
  - Text: embroidery-black (labels), embroidery-gray (hints)
  - Backgrounds: linen-50 (sections)

### Error Handling

- Invalid form data shows red error box
- File validation prevents upload if > 10MB
- URL validation for music links (type="url" browser validation)
- Error clears on form submission attempt
- Async error caught and displayed in form

---

## MesaForm Component

### Purpose
Creates discussion tables (Mesas) nested within a Roda.

### Location
`src/components/MesaForm.tsx`

### Props Interface
```typescript
interface MesaFormProps {
  rodaId: string;
  onSubmit: (data: CreateMesaDTO) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}
```

### Form Fields

#### 1. Nome da Mesa (required)
- Text input
- Placeholder: "Ex: Mesa 1: Temática Principal"
- Validates non-empty trim()

#### 2. Descrição (required)
- Textarea with 300 character limit
- Real-time counter: "current/300"
- Resize disabled
- Placeholder: "Descrição breve do tema a ser discutido..."

### Validation Rules

1. Nome and descricao both required (trim check)
   - Message: "Nome e descrição são obrigatórios"

### Data Transformation

**On submit**, converts to CreateMesaDTO:
```typescript
{
  rodaId: string,
  nome: string,
  descricao: string
}
```

The hook then enriches it with:
- `id`: `mesa-${Date.now()}`
- `criadorId`: 'user-current'
- `criadoEm`: new Date()
- `atualizadoEm`: new Date()
- `ordem`: current mesas length + 1

### UI/UX Details

- **Compact Layout**: Suitable for modal or sidebar use
- **Sticky Buttons**: Flex row with small padding
- **Color Scheme**: Same as RodaForm (terracotta/linen)
- **Form Reset**: Input cleared after successful submission
- **State Management**: Parent component controls modal visibility

### Error Display

- Red error box matching RodaForm style
- Error clears on submit attempt
- Async errors caught and displayed

---

## Form Integration Flow

### Creating a Roda

```
RodasPage (showForm = true)
  └── RodaForm
      - User fills all sections
      - Clicks "Criar Roda"
      - onSubmit handler validates
      - useRodas.createRoda adds to state
      - Notification shows success
      - showForm toggled false
```

### Adding a Mesa

```
RodaDetail (showMesaForm = true)
  └── MesaForm
      - User fills nome/descricao
      - Clicks "Criar Mesa"
      - onSubmit handler validates
      - useRodas.addMesa updates state
      - Notification shows success
      - showMesaForm toggled false
      - Mesa appears in list
```

---

## Styling Notes

### Tailwind Classes Used

**Inputs:**
- `px-4 py-2 rounded-lg border-2 border-linen-300`
- `focus:outline-none focus:border-terracotta-400`
- `font-body text-embroidery-black`

**Labels:**
- `block text-sm font-embroidery text-embroidery-black mb-1`

**Sections:**
- `space-y-4` vertical spacing
- `pt-4 border-t-2 border-linen-300` section dividers
- `p-4 rounded-lg bg-linen-50 border-2 border-linen-300` subsections

**Buttons:**
- `embroidery-button embroidery-thread-[color]`
- `bg-gradient-to-b from-[color]-500 to-[color]-700`
- `px-4 py-2 rounded-lg font-embroidery text-sm`

**Counter Text:**
- `text-xs text-embroidery-gray mt-1`

### Responsive Behavior

- **Mobile**: Full width inputs, single column
- **Tablet+**: 2-column grid for optional fields in RodaForm
- **Overflow**: max-h-96 with scroll for long forms

---

## Browser/File Upload Considerations

- **FileReader API**: Used for Base64 encoding (modern browsers only)
- **File Size Limit**: 10MB enforced client-side via .size check
- **File Types**: MIME type filters via accept attribute
- **Preview Images**: Displayed inline with img tags
- **Error Handling**: Try/catch around FileReader operations

---

## Accessibility Features

- All inputs have associated `<label>` elements
- `required` attribute on form fields
- Placeholder text provides additional context
- Error messages display prominently
- Button text clearly describes action ("Criar Roda" vs "Cancelar")
- Tab navigation through form fields
- Character counters help users understand limits
