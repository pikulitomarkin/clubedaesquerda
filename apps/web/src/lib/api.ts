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

  // Não confiar só em status === 204: vários endpoints "sem corpo" desta
  // API respondem 200 com corpo vazio (handler que retorna void, sem
  // @HttpCode explícito) — chamar .json() nesse caso lança um SyntaxError
  // de parsing (não um ApiError), fazendo a ação parecer ter falhado no
  // client mesmo quando teve sucesso no servidor (ex.: "Fechar roda").
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
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

// Caixa de sugestões da home ("SUGIRA PRA NÓS") — exige login.
export function createSugestao(input: { sugiro: string; porque?: string }, token: string) {
  return request<{ id: string; createdAt: string }>("/sugestoes", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
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
  // "SENT" = eu pedi e ainda não responderam; "RECEIVED" = o dono do
  // perfil me pediu e está esperando minha resposta.
  friendRequest: "SENT" | "RECEIVED" | null;
  friendshipId: string | null;
  hasLiked: boolean;
  matchId: string | null;
}

// Bandeira/interesse exibidos no perfil (ícone + nome) — subconjunto do
// CatalogItem (sem cor/categoria, que não fazem sentido aqui).
export interface PerfilTag {
  slug: string;
  name: string;
  imageUrl: string | null;
}

export interface UserProfile {
  id: string;
  status: string;
  createdAt: string;
  profile: {
    displayName: string;
    bio: string | null;
    photos?: string[] | null;
    photoUrl: string | null;
    city: string | null;
    state: string | null;
    bandeiras: PerfilTag[];
    interesses: PerfilTag[];
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
  // Galeria de até 3 fotos; photoUrl é a principal (= photos[0]).
  photos: string[];
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
    // Enviar a galeria inteira; a API espelha a primeira em photoUrl.
    photos?: string[];
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
  // Patch/ícone bordado do catálogo do cliente, servido pelo Next
  // (/bandeiras/<slug>.png, /interesses/<slug>.png).
  imageUrl?: string | null;
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

export interface FriendshipResult {
  friendshipId?: string;
  chatId: string | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
}

// Abre um pedido de amizade — ou aceita na hora, se o alvo já tinha
// pedido pra mim (ver FriendshipsService.add).
export function addFriend(addresseeId: string, token: string) {
  return request<FriendshipResult>("/friendships", token, {
    method: "POST",
    body: JSON.stringify({ addresseeId }),
  });
}

export interface FriendRequest {
  id: string;
  createdAt: string;
  requester: { id: string; profile: { displayName: string; photoUrl: string | null } | null };
}

// Seção "Solicitações de amizade" no próprio perfil.
export function listPendingFriendRequests(token: string) {
  return request<FriendRequest[]>("/friendships/pendentes", token);
}

export function respondFriendRequest(friendshipId: string, accept: boolean, token: string) {
  return request<FriendshipResult>(`/friendships/${friendshipId}/resposta`, token, {
    method: "POST",
    body: JSON.stringify({ accept }),
  });
}

export interface Friend {
  id: string;
  profile: { displayName: string; photoUrl: string | null } | null;
}

// Lista de amigos exibida no perfil (própria ou de terceiros).
export function listFriends(userId: string, token: string) {
  return request<Friend[]>(`/users/${userId}/amigos`, token);
}

export function blockUser(userId: string, token: string) {
  return request<void>("/blocks", token, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// --- Chat direto (botão CONVERSAR) ---

// Diferente de addFriend: não exige amizade, qualquer pessoa pode chamar.
export function startChat(userId: string, token: string) {
  return request<{ id: string }>(`/chats/${userId}/iniciar`, token, { method: "POST" });
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
  sender: { id: string; profile: { displayName: string; photoUrl: string | null } | null };
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
  // Nome/imagem já resolvidos pela API: para GROUP de Roda (comunidade) é
  // o nome/imagem da Roda; para "roda de conversa" avulsa, os próprios do
  // chat. DIRECT não usa este campo (ver otherUser).
  name: string | null;
  imageUrl: string | null;
  isCreator: boolean;
  otherUser: { id: string; profile: { displayName: string; photoUrl: string | null } | null } | null;
  lastMessage: ChatMessage | null;
}

export function listMyChats(token: string) {
  return request<ChatSummary[]>("/chats", token);
}

// --- "Roda de Conversa" avulsa (botão acima da lista de chats) ---

export function createGroupChat(
  dto: { participantIds: string[]; name: string; imageUrl?: string },
  token: string,
) {
  return request<{ id: string }>("/chats/grupo", token, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// Botão "SAIR" — qualquer membro, exceto o criador.
export function leaveGroupChat(chatId: string, token: string) {
  return request<void>(`/chats/${chatId}/sair`, token, { method: "POST" });
}

// Botão "FECHAR RODA" — só o criador; descarta o chat para todos.
export function closeGroupChat(chatId: string, token: string) {
  return request<void>(`/chats/${chatId}`, token, { method: "DELETE" });
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

export interface RodaMembro {
  userId: string;
  role: string;
  user: { id: string; profile: { displayName: string; photoUrl: string | null } | null };
}

export interface Roda {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  gifUrl: string | null;
  musicUrls: string[];
  visibility: string;
  membros: RodaMembro[];
  mesas: { id: string; name: string }[];
  organizer: { id: string; profile: { displayName: string } | null } | null;
  chat: { id: string } | null;
}

export function createRoda(
  dto: { name: string; description?: string; imageUrl?: string; gifUrl?: string; musicUrls?: string[] },
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
  { value: "PRESENCIAL", label: "Evento presencial" },
  { value: "ONLINE", label: "Evento online" },
  { value: "CLUBE", label: "Clubes" },
  { value: "ANALISE", label: "Análises" },
] as const;

export const CLUBE_TIPOS = [
  { value: "LIVRO", label: "Livro" },
  { value: "CINE", label: "Cine" },
  { value: "TEATRO", label: "Teatro" },
  { value: "NOVELA", label: "Novela" },
  { value: "TEXTO", label: "Texto" },
  { value: "VIDEO", label: "Vídeo" },
] as const;

export const RECURRENCE_MODES = [
  { value: "UNICO", label: "Único" },
  { value: "RECORRENTE", label: "Recorrente" },
  { value: "PERMANENTE", label: "Permanente" },
] as const;

export const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
] as const;

export interface CreateEventoInput {
  tipo: string;
  title: string;
  organizerName?: string;
  description?: string;
  coverImageUrl?: string;
  // presencial
  locationName?: string;
  address?: string;
  locationUrl?: string;
  // online / clube / análise
  onlineUrl?: string;
  // pago ou gratuito (presencial/online/clube)
  isFree?: boolean;
  ticketUrl?: string;
  // clube
  clubeTipo?: string;
  // clube e análise
  obraNome?: string;
  // data/horário fixos (presencial/online/clube)
  startsAt?: string;
  // análise (sem data fixa)
  dayOfWeek?: number;
  time?: string;
  // recorrência (clube/análise)
  recurrenceMode?: string;
  recurrenceText?: string;
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
  organizerId: string;
  organizerName: string | null;
  coverImageUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  locationName: string | null;
  locationUrl: string | null;
  onlineUrl: string | null;
  isFree: boolean | null;
  ticketUrl: string | null;
  clubeTipo: string | null;
  obraNome: string | null;
  dayOfWeek: number | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  confirmedCount: number;
  recurrenceMode: string;
  recurrenceText: string | null;
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

// Botão "EVENTOS" do perfil / página de Eventos — próximos eventos
// publicados, para descobrir. `q` é a busca por nome; `tipo` filtra por
// Evento presencial / Evento online / Clubes / Análises.
export interface EventoResumo {
  id: string;
  title: string;
  tipo: string;
  city: string | null;
  state: string | null;
  startsAt: string;
  coverImageUrl: string | null;
  recurrenceMode: string;
  organizer: { profile: { displayName: string } | null };
}

export function listEventosProximos(token: string, opts?: { q?: string; tipo?: string; cursor?: string }) {
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (opts?.tipo) params.set("tipo", opts.tipo);
  if (opts?.cursor) params.set("cursor", opts.cursor);
  const qs = params.toString();
  return request<EventoResumo[]>(`/eventos${qs ? `?${qs}` : ""}`, token);
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

// Botão "RODAS" do perfil — diretório público de rodas para descobrir.
export interface RodaPublica {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  visibility: string;
  bandeira: { name: string; color: string | null } | null;
  _count: { membros: number };
}

export function listRodasPublicas(token: string, opts?: { q?: string; cursor?: string }) {
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (opts?.cursor) params.set("cursor", opts.cursor);
  const qs = params.toString();
  return request<RodaPublica[]>(`/rodas${qs ? `?${qs}` : ""}`, token);
}

// --- Mesas ---

export interface Mesa {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  roda: { id: string; name: string; slug: string } | null;
  evento: { id: string; title: string } | null;
  creator: { id: string; profile: { displayName: string } | null } | null;
  _count: { participantes: number };
}

export function getMesa(id: string, token: string) {
  return request<Mesa>(`/mesas/${id}`, token);
}

export function createMesa(
  dto: { name: string; description?: string; rodaId?: string; eventoId?: string; capacity?: number },
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
