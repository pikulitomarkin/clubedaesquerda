import type { LoginInput, RegisterInput } from "@clube/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// `token` é o access token JWT (obtido de useAuth().accessToken) — a API
// espera `Authorization: Bearer <token>`, não o cookie (esse carrega só
// o refresh token, httpOnly, usado exclusivamente em /auth/refresh).
async function request<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? "Erro inesperado, tente novamente", res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Auth ---

export function registerUser(input: RegisterInput) {
  return request<{ id: string }>("/auth/register", undefined, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginUser(input: LoginInput) {
  return request<{ accessToken: string; emailVerified: boolean }>("/auth/login", undefined, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyEmail(token: string) {
  return request<{ verified: boolean }>("/auth/verify-email", undefined, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function refreshSession() {
  return request<{ accessToken: string }>("/auth/refresh", undefined, { method: "POST" });
}

export function forgotPassword(email: string) {
  return request<{ message: string }>("/auth/forgot-password", undefined, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(input: { token: string; password: string; confirmPassword: string }) {
  return request<{ message: string }>("/auth/reset-password", undefined, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// --- Usuários / perfil ---

export interface ViewerRelation {
  isFriend: boolean;
  hasLiked: boolean;
  matchId: string | null;
}

export interface UserProfile {
  id: string;
  status: string;
  createdAt: string;
  profile: {
    displayName: string;
    bio: string | null;
    photoUrl: string | null;
    city: string | null;
    state: string | null;
  } | null;
  viewer: ViewerRelation | null;
}

export function getUser(id: string, token: string) {
  return request<UserProfile>(`/users/${id}`, token);
}

// --- Edição do próprio perfil ---

export interface MyProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  city: string | null;
  state: string | null;
  bandeiraIds: string[];
  interesseIds: string[];
}

export function getMyProfile(token: string) {
  return request<MyProfile>("/profiles/me", token);
}

export function updateMyProfile(
  dto: {
    displayName?: string;
    bio?: string;
    photoUrl?: string;
    city?: string;
    state?: string;
    bandeiraIds?: string[];
    interesseIds?: string[];
  },
  token: string,
) {
  return request<MyProfile>("/profiles/me", token, { method: "PATCH", body: JSON.stringify(dto) });
}

export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  color?: string | null;
  category?: string | null;
}

export function listBandeiras(token?: string) {
  return request<CatalogItem[]>("/bandeiras", token);
}

export function listInteresses(token?: string) {
  return request<CatalogItem[]>("/interesses", token);
}

// --- Matches (botão GOSTEI) ---

export function swipe(targetId: string, liked: boolean, token: string) {
  return request<{ matched: boolean; matchId?: string; chatId?: string }>("/matches/swipe", token, {
    method: "POST",
    body: JSON.stringify({ targetId, liked }),
  });
}

// --- Amizades / bloqueio (botões ADICIONAR / BLOQUEAR) ---

export function addFriend(addresseeId: string, token: string) {
  return request<{ friendshipId?: string; chatId: string }>("/friendships", token, {
    method: "POST",
    body: JSON.stringify({ addresseeId }),
  });
}

export function blockUser(userId: string, token: string) {
  return request<void>("/blocks", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// --- Homenagens ---

export interface Homenagem {
  id: string;
  content: string;
  visible: boolean;
  createdAt: string;
  author: { id: string; profile: { displayName: string; photoUrl: string | null } | null };
}

export function listHomenagens(userId: string, token: string) {
  return request<Homenagem[]>(`/users/${userId}/homenagens`, token);
}

export function createHomenagem(recipientId: string, content: string, token: string) {
  return request<Homenagem>("/homenagens", token, {
    method: "POST",
    body: JSON.stringify({ recipientId, content }),
  });
}

export function setHomenagemVisibility(id: string, visible: boolean, token: string) {
  return request<Homenagem>(`/homenagens/${id}/visibility`, token, {
    method: "PATCH",
    body: JSON.stringify({ visible }),
  });
}

// --- Denúncia ("DENUNCIAR DE TROLL") ---

export const REPORT_CATEGORIES = [
  { value: "OFENSIVO", label: "Ofensivo" },
  { value: "RACISMO", label: "Racismo" },
  { value: "LGBTFOBIA", label: "LGBTfobia" },
  { value: "MISOGINIA", label: "Misoginia" },
  { value: "DESRESPEITO_REGRAS", label: "Desrespeito às regras" },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]["value"];

export function createReport(
  dto: { reportedUserId: string; category: ReportCategory; description?: string; evidenceRefs?: string[] },
  token: string,
) {
  return request<{ id: string }>("/reports", token, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// Mídia pública (foto de perfil, capa de roda, imagem de post): devolve URL.
export async function uploadFile(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ url: string }>("/uploads", token, { method: "POST", body: formData });
}

// Anexo de denúncia: vai para o diretório PRIVADO e devolve uma referência
// opaca (não uma URL pública) — só moderação lê, via rota autenticada.
export async function uploadEvidence(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ ref: string }>("/reports/evidence", token, { method: "POST", body: formData });
}

// --- Chat ---

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: string;
}

export function listChatMessages(chatId: string, token: string) {
  return request<ChatMessage[]>(`/chats/${chatId}/messages`, token);
}

export function sendChatMessageRest(chatId: string, content: string, token: string) {
  return request<ChatMessage>("/chats/messages", token, {
    method: "POST",
    body: JSON.stringify({ chatId, type: "TEXT", content }),
  });
}

export interface ChatSummary {
  id: string;
  type: "DIRECT" | "GROUP";
  roda: { id: string; name: string; imageUrl: string | null } | null;
  otherUser: { id: string; profile: { displayName: string; photoUrl: string | null } | null } | null;
  lastMessage: ChatMessage | null;
}

export function listMyChats(token: string) {
  return request<ChatSummary[]>("/chats", token);
}

// --- Emojis personalizados ---

export interface CustomEmoji {
  id: string;
  shortcode: string;
  imageUrl: string;
}

export function listEmojis(token: string) {
  return request<CustomEmoji[]>("/emojis", token);
}

// --- Busca de GIF ---

export interface GifResult {
  id: string;
  previewUrl: string;
  url: string;
  title: string;
}

export function searchGifs(query: string, token: string) {
  return request<GifResult[]>(`/gifs/search?q=${encodeURIComponent(query)}`, token);
}

// --- Rodas de Conversa ---

export interface Roda {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  visibility: string;
  membros: { userId: string; role: string }[];
  chat: { id: string } | null;
}

export function createRoda(
  dto: { name: string; description?: string; imageUrl?: string; visibility: string },
  token: string,
) {
  return request<Roda>("/rodas", token, { method: "POST", body: JSON.stringify(dto) });
}

export function getRoda(slug: string, token: string) {
  return request<Roda>(`/rodas/${slug}`, token);
}

export function joinRoda(rodaId: string, token: string) {
  return request<{ rodaId: string; userId: string; role: string }>(`/rodas/${rodaId}/membros`, token, {
    method: "POST",
  });
}

export function leaveRoda(rodaId: string, token: string) {
  return request<void>(`/rodas/${rodaId}/membros/me`, token, { method: "DELETE" });
}

export function closeRoda(rodaId: string, token: string) {
  return request<void>(`/rodas/${rodaId}`, token, { method: "DELETE" });
}

// --- Eventos ---

export const EVENTO_TIPOS = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "ONLINE", label: "Online" },
  { value: "CLUBE", label: "Clube (encontro fechado da roda)" },
  { value: "ANALISE", label: "Roda de análise de conjuntura" },
] as const;

export const RECURRENCE_OPTIONS = [
  { value: "", label: "Único (não se repete)" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL", label: "Mensal" },
] as const;

export interface CreateEventoInput {
  title: string;
  description?: string;
  tipo: string;
  address?: string;
  city?: string;
  state?: string;
  onlineUrl?: string;
  rodaId?: string;
  bandeiraId?: string;
  startsAt: string;
  endsAt?: string;
  capacity?: number;
  recurrenceFrequency?: string;
  recurrenceUntil?: string;
}

export interface EventoUser {
  id: string;
  profile: { displayName: string; photoUrl: string | null } | null;
}

export interface Evento {
  id: string;
  title: string;
  description: string | null;
  tipo: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  onlineUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  confirmedCount: number;
  recurrenceFrequency: string | null;
  recurrenceUntil: string | null;
  organizer: EventoUser;
  confirmacoes?: { userId: string; confirmedAt: string; user: EventoUser }[];
}

export function createEvento(dto: CreateEventoInput, token: string) {
  return request<Evento>("/eventos", token, { method: "POST", body: JSON.stringify(dto) });
}

export function getEvento(id: string, token: string) {
  return request<Evento>(`/eventos/${id}`, token);
}

export function listEventosForUser(userId: string, token: string) {
  return request<Evento[]>(`/users/${userId}/eventos`, token);
}

export function confirmAttendance(eventoId: string, token: string) {
  return request<{ status: string; confirmacaoId: string }>(`/eventos/${eventoId}/confirmacoes`, token, {
    method: "POST",
  });
}

export function cancelAttendance(eventoId: string, token: string) {
  return request<void>(`/eventos/${eventoId}/confirmacoes`, token, { method: "DELETE" });
}

// --- Convites ---

export interface Convite {
  id: string;
  status: string;
  createdAt: string;
  evento: { id: string; title: string; startsAt: string; tipo: string };
  inviter: EventoUser;
}

export function sendConvite(eventoId: string, inviteeId: string, token: string) {
  return request<{ id: string }>(`/eventos/${eventoId}/convites`, token, {
    method: "POST",
    body: JSON.stringify({ inviteeId }),
  });
}

export function listPendingConvites(token: string) {
  return request<Convite[]>("/convites/pendentes", token);
}

export function respondConvite(conviteId: string, accept: boolean, token: string) {
  return request<Convite>(`/convites/${conviteId}/resposta`, token, {
    method: "POST",
    body: JSON.stringify({ accept }),
  });
}

// --- Rodas no perfil ---

export interface RodaMembership {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  role: string;
  joinedAt: string;
}

export function listRodasForUser(userId: string, token: string) {
  return request<RodaMembership[]>(`/users/${userId}/rodas`, token);
}

// --- Mesas ---

export interface Mesa {
  id: string;
  name: string;
  capacity: number | null;
  roda: { id: string; name: string; slug: string } | null;
  evento: { id: string; title: string } | null;
  _count: { participantes: number };
}

export function getMesa(id: string, token: string) {
  return request<Mesa>(`/mesas/${id}`, token);
}

export function createMesa(
  dto: { name: string; rodaId?: string; eventoId?: string; capacity?: number },
  token: string,
) {
  return request<Mesa>("/mesas", token, { method: "POST", body: JSON.stringify(dto) });
}

export function joinMesa(mesaId: string, token: string) {
  return request<{ mesaId: string; userId: string }>(`/mesas/${mesaId}/participantes`, token, {
    method: "POST",
  });
}

// --- Posts e reações ---

export const REACTION_TYPES = [
  { value: "UAU", label: "UAU!" },
  { value: "FERA", label: "FERA" },
  { value: "EITA", label: "EITA" },
  { value: "NOPS", label: "NOPS" },
  { value: "PERAI", label: "PERAÍ" },
] as const;

export type ReactionTypeValue = (typeof REACTION_TYPES)[number]["value"];

export interface Post {
  id: string;
  authorId: string;
  rodaId: string | null;
  mesaId: string | null;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  author: { id: string; profile: { displayName: string; photoUrl: string | null } | null };
  reactionCounts: Partial<Record<ReactionTypeValue, number>>;
  viewerReaction: ReactionTypeValue | null;
}

export function listPostsByRoda(rodaId: string, token?: string) {
  return request<Post[]>(`/posts/rodas/${rodaId}`, token);
}

export function listPostsByMesa(mesaId: string, token?: string) {
  return request<Post[]>(`/posts/mesas/${mesaId}`, token);
}

export function createPost(
  dto: { content: string; rodaId?: string; mesaId?: string; visibility: string },
  token: string,
) {
  return request<Post>("/posts", token, { method: "POST", body: JSON.stringify(dto) });
}

export function deletePost(id: string, token: string) {
  return request<void>(`/posts/${id}`, token, { method: "DELETE" });
}

export function reactToPost(targetId: string, type: ReactionTypeValue, token: string) {
  return request<{ id: string }>("/reactions", token, {
    method: "POST",
    body: JSON.stringify({ targetType: "POST", targetId, type }),
  });
}

export function removeReaction(targetId: string, token: string) {
  return request<void>(`/reactions/${targetId}?targetType=POST`, token, { method: "DELETE" });
}
