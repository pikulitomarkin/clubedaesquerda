# Roda CRUD System - Comprehensive Summary

## Overview
The Roda (discussion circle) CRUD system provides a complete platform for organizing and managing group discussions with nested topics (Mesas), music playlists, and animated loops. This document outlines all components, types, hooks, and pages created.

## File Structure

### Types (`src/types/rodas.ts`)
```typescript
- LinkMusica: { id, url, titulo, plataforma }
- Mesa: { id, rodaId, nome, descricao, criadorId, criadoEm, atualizadoEm, ordem }
- Roda: { id, nome, descricao, imagemCapa?, gifLoop?, musicas[], mesas[], criadorId, criadoEm, atualizadoEm, ativo, tags?, categoria?, participantesCount? }
- CreateRodaDTO: { nome, descricao, imagemCapa?, gifLoop?, musicas[], tags?, categoria? }
- CreateMesaDTO: { rodaId, nome, descricao, ordem? }
- FiltrosRoda: { busca?, categoria?, apenas_ativas?, ordenar? }
```

### Data (`src/data/rodas-exemplos.ts`)
Three fully populated example rodas:
1. **Feminismo e Trabalho** - 3 mesas, 3 music links (YouTube, Spotify, SoundCloud)
2. **Marxismo e Teoria Crítica** - 2 mesas, 3 music links
3. **Música e Resistência** - 1 mesa, 3 music links

Each includes animated GIFs, images, tags, category labels, and participant counts.

### Components

#### RodaForm (`src/components/RodaForm.tsx`)
Creates/edits a Roda with:
- Basic info: nome, descricao, categoria, tags
- Media: image upload (capa), animated GIF upload
- Music playlist: 3 fixed music slots with platform selector, title, and URL
- File upload with Base64 encoding and image preview
- 10MB file size limit per image
- Form validation and error handling
- Sticky footer with Cancelar/Criar buttons

#### MesaForm (`src/components/MesaForm.tsx`)
Creates/edits a Mesa (discussion topic) with:
- nome field (required)
- descricao field (required, 300 char limit)
- Real-time character counter
- Error handling
- Compact form suitable for modal display

#### RodaList (`src/components/RodaList.tsx`)
Displays all rodas in a filtered grid with:
- Search by name, description, or tags
- Filter by categoria
- Sort options: recentes, nome, populares
- "Apenas ativas" checkbox
- Grid layout (1 col mobile, 2 cols tablet, 3 cols desktop)
- Each card shows: image, name, category, description, tags (max 2 + count), participant count, mesa count
- "Ver Detalhes" button per roda
- Delete button (with confirmation) per roda
- Empty state messaging

#### RodaDetail (`src/components/RodaDetail.tsx`)
Displays a single roda's complete information:
- Back button to list
- Title, category, and full description
- Status badge (Ativa/Inativa)
- Meta info: participants, creation date, tags
- Integrated MusicPlayer component (if musicas present)
- Full image display (if imagemCapa present)
- "Mesas de Discussão" section with:
  - "+ Nova Mesa" button (toggles MesaForm)
  - List of all mesas sorted by order
  - Each mesa card shows: nome, descricao, creation date, creator
  - Delete button per mesa (with confirmation)
- Empty state for mesas with helpful message

#### MusicPlayer (`src/components/MusicPlayer.tsx`) [Previously Created]
Plays music and animates GIF with:
- Animated GIF display (if gifLoop present)
- Current track display with platform icon
- "Abrir em [Platform]" button with external link
- Interactive playlist showing all 3 musicas
- Click to select and play different tracks
- Platform-specific icons (Spotify 🎵, YouTube 📺, SoundCloud ☁️)
- Empty state messaging

### Hooks

#### useRodas (`src/hooks/useRodas.ts`)
State management hook with:
- `rodas`: current list of all rodas
- `selectedRoda`: currently viewed roda
- `isLoading`: async operation indicator
- `error`: error message if any operation fails

**Methods:**
- `createRoda(data)`: Creates new roda from CreateRodaDTO, auto-generates id/dates, sets ativo: true
- `addMesa(mesa)`: Adds mesa to specific roda and updates selectedRoda
- `updateMesa(mesaId, data)`: Updates mesa fields and refreshes timestamps
- `deleteMesa(mesaId)`: Removes mesa from roda
- `deleteRoda(rodaId)`: Removes entire roda (and clears selection if active)
- `selectRoda(roda)`: Sets selectedRoda for detail view
- `loadRodas(data)`: Bulk load rodas (for initialization)

### Pages

#### RodasPage (`src/pages/RodasPage.tsx`)
Main page orchestrating all components:
- Header with terracota gradient, title, and description
- Conditional rendering:
  - **List View**: Shows RodaList + "+ Criar Roda" button + optional RodaForm
  - **Detail View**: Shows RodaDetail with back button
- Handles all CRUD operations via useRodas hook
- Notification system (3s toast) for success/error feedback
- Initializes with RODAS_EXEMPLO data
- Responsive layout (max-w-7xl)

## Design System Integration

All components use the established embroidery design system:
- **Colors**: terracotta (primary), linen (secondary), embroidery-black (text)
- **Typography**: font-embroidery (titles), font-body (content)
- **Spacing**: Tailwind defaults with custom gap patterns
- **Buttons**: embroidery-button classes with thread colors
- **Shadows**: shadow-embroidery for depth
- **Animations**: animate-pulse for GIF preview, transition-shadow for hovers

## Component Composition

```
RodasPage
├── RodaForm (when creating new)
└── RodaList (when listing)
    └── RodaDetail (when viewing single)
        ├── MusicPlayer
        └── MesaForm (when adding mesa)
```

## Data Flow

1. **Initialization**: RodasPage loads RODAS_EXEMPLO via useRodas hook
2. **Create Roda**: RodaForm → handleCreateRoda → useRodas.createRoda → RodaList updates
3. **View Detail**: RodaList.onSelectRoda → useRodas.selectRoda → RodaDetail renders
4. **Add Mesa**: RodaDetail.MesaForm → handleAddMesa → useRodas.addMesa → RodaDetail.mesas updates
5. **Delete**: Confirmation prompt → handleDelete* → useRodas.delete* → UI updates
6. **Notification**: Toast appears for 3 seconds on success/error

## Validation & Error Handling

**RodaForm validation:**
- Nome and descricao required
- At least 1 music link required (URL format)
- File size max 10MB per image
- URL validation for music links (try/catch URL constructor)

**MesaForm validation:**
- Nome and descricao required
- 300 char limit on descricao

**RodaList filtering:**
- Case-insensitive search
- Multi-field search (nome, descricao, tags)
- Category exact match
- Date sorting by atualizadoEm

## Key Features

✓ **Music Playlist Management**: 3 links per roda with platform selection
✓ **Animated GIF Loop**: Display loop animation with pulse effect
✓ **Nested Discussions**: Multiple mesas per roda with independent CRUD
✓ **Rich Search & Filtering**: Full-text search, category filter, sort options
✓ **Image Uploads**: Base64 encoding with preview and file size validation
✓ **Responsive Design**: Mobile-first grid layouts
✓ **State Persistence**: useRodas hook for global state management
✓ **User Feedback**: Notifications for all operations
✓ **Accessibility**: Semantic HTML, keyboard navigation, clear labels

## Optional Enhancements (Future)

- [ ] localStorage persistence for rodas (similar to chat messages)
- [ ] Real-time collaboration (WebSocket for live mesa updates)
- [ ] Participant management (add/remove users from mesas)
- [ ] Mesa scheduling and calendar integration
- [ ] Transcript/notes export per mesa
- [ ] Audio recording of mesas
- [ ] Comment/reaction system on mesas
- [ ] Roda analytics (participation metrics, popular topics)
