"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { HomenagensSection } from "@/components/HomenagensSection";
import { EventosSection } from "@/components/EventosSection";
import { RodasSection } from "@/components/RodasSection";
import { ReportModal } from "@/components/ReportModal";
import { useAuth } from "@/lib/auth-context";
import { useChatDock } from "@/lib/chat-dock-context";
import { addFriend, ApiError, blockUser, getUser, startChat, swipe, type UserProfile } from "@/lib/api";

export default function PerfilPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, userId } = useAuth();
  const { openChat } = useChatDock();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const isOwnProfile = userId === id;

  async function refresh() {
    if (!accessToken) return;
    try {
      setProfile(await getUser(id, accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? "Perfil não encontrado" : "Erro ao carregar perfil");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken]);

  // Botão "GOSTEI": registra a curtida; se houver reciprocidade, a API
  // já devolve matchId/chatId — o popup em si é disparado pelo evento
  // realtime "match:created" (RealtimeProvider), que chega para os dois
  // lados. Aqui só navegamos direto se este clique fechou o match.
  async function handleGostei() {
    if (!accessToken) return;
    setBusy("gostei");
    setActionError(null);
    try {
      const result = await swipe(id, true, accessToken);
      if (result.matched && result.chatId) {
        openChat({ id: result.chatId, title: profile?.profile?.displayName ?? "Chat" });
      } else {
        await refresh();
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível curtir");
    } finally {
      setBusy(null);
    }
  }

  // Botão "CONVERSAR": qualquer pessoa pode iniciar, sem exigir amizade
  // (diferente de ADICIONAR). A API barra se houver bloqueio entre as
  // partes.
  async function handleConversar() {
    if (!accessToken) return;
    setBusy("conversar");
    setActionError(null);
    try {
      const chat = await startChat(id, accessToken);
      openChat({ id: chat.id, title: profile?.profile?.displayName ?? "Chat" });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível iniciar a conversa");
    } finally {
      setBusy(null);
    }
  }

  async function handleAdicionar() {
    if (!accessToken) return;
    setBusy("adicionar");
    setActionError(null);
    try {
      const result = await addFriend(id, accessToken);
      await refresh();
      openChat({ id: result.chatId, title: profile?.profile?.displayName ?? "Chat" });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível adicionar");
    } finally {
      setBusy(null);
    }
  }

  // O mesmo botão que mostrava "ADICIONAR" vira "BLOQUEAR" assim que os
  // dois são amigos — não é um botão de bloqueio separado, é a
  // transformação descrita no spec do cliente.
  async function handleBloquear() {
    if (!accessToken) return;
    if (!confirm("Bloquear este perfil? Vocês deixarão de se ver mutuamente.")) return;
    setBusy("bloquear");
    setActionError(null);
    try {
      await blockUser(id, accessToken);
      router.push("/");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível bloquear");
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">{error}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">Carregando...</p>
      </main>
    );
  }

  const viewer = profile.viewer;
  const fotos = profile.profile?.photos?.length
    ? profile.profile.photos
    : profile.profile?.photoUrl
      ? [profile.profile.photoUrl]
      : [];
  const bandeiras = profile.profile?.bandeiras ?? [];
  const interesses = profile.profile?.interesses ?? [];

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      {/* Galeria de até 3 fotos; perfis antigos têm só photoUrl. */}
      {fotos.length === 0 ? (
        <EmbroideryLogo size="sm" />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {fotos.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={`${profile.profile?.displayName ?? "Perfil"} — foto ${i + 1}`}
              className={`rounded-full object-cover shadow-embroidery-3d ${i === 0 ? "h-28 w-28" : "h-20 w-20"}`}
            />
          ))}
        </div>
      )}

      <section className="w-full max-w-md flex flex-col gap-5 text-center p-6 bg-white/80 rounded-lg shadow-embroidery">
        <div>
          {/* TÍTULO */}
          <h1 className="font-heading text-3xl mb-1">{profile.profile?.displayName ?? "Perfil"}</h1>
          {profile.profile?.city && (
            <p className="font-body text-xs text-embroidery-gray">
              {profile.profile.city}
              {profile.profile.state ? `, ${profile.profile.state}` : ""}
            </p>
          )}
        </div>

        {isOwnProfile && (
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/perfil/editar">
              <EmbroideryButton variant="secondary" threadColor="black" size="sm">
                Editar perfil
              </EmbroideryButton>
            </Link>
            {/* "RODA DE CONVERSA" — só o próprio usuário, leva à página de
                chat (inbox de conversas). */}
            <Link href="/chats">
              <EmbroideryButton variant="secondary" threadColor="blue" size="sm">
                Roda de Conversa
              </EmbroideryButton>
            </Link>
          </div>
        )}

        {profile.profile?.bio && (
          <div className="text-left">
            <h2 className="font-heading text-lg mb-1">Descrição</h2>
            <p className="font-body text-sm whitespace-pre-wrap">{profile.profile.bio}</p>
          </div>
        )}

        {bandeiras.length > 0 && (
          <div className="text-left">
            <h2 className="font-heading text-lg mb-2">Bandeiras</h2>
            <div className="flex flex-wrap gap-3">
              {bandeiras.map((b) => (
                <div key={b.slug} className="flex flex-col items-center gap-1 w-16">
                  {b.imageUrl && <img src={b.imageUrl} alt="" aria-hidden className="h-10 w-auto object-contain" />}
                  <span className="font-body text-[10px] text-center leading-tight">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {interesses.length > 0 && (
          <div className="text-left">
            <h2 className="font-heading text-lg mb-2">Interesses</h2>
            <div className="flex flex-wrap gap-3">
              {interesses.map((i) => (
                <div key={i.slug} className="flex flex-col items-center gap-1 w-16">
                  {i.imageUrl && <img src={i.imageUrl} alt="" aria-hidden className="h-10 w-auto object-contain" />}
                  <span className="font-body text-[10px] text-center leading-tight">{i.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isOwnProfile && viewer && (
          <div className="flex flex-wrap justify-center gap-3">
            {/* GOSTEI — rosa goiaba. */}
            {viewer.matchId ? (
              <EmbroideryButton threadColor="gold" disabled>
                Já é match
              </EmbroideryButton>
            ) : (
              <EmbroideryButton
                threadColor="guava"
                onClick={handleGostei}
                isLoading={busy === "gostei"}
                disabled={viewer.hasLiked}
              >
                {viewer.hasLiked ? "Curtido" : "Gostei"}
              </EmbroideryButton>
            )}

            {/* CONVERSAR — azul. Qualquer pessoa pode iniciar. */}
            <EmbroideryButton
              variant="secondary"
              threadColor="blue"
              onClick={handleConversar}
              isLoading={busy === "conversar"}
            >
              Conversar
            </EmbroideryButton>

            {/* ADICIONAR (verde) vira BLOQUEAR (laranja) assim que amigos. */}
            {viewer.isFriend ? (
              <EmbroideryButton
                variant="secondary"
                threadColor="orange"
                onClick={handleBloquear}
                isLoading={busy === "bloquear"}
              >
                Bloquear
              </EmbroideryButton>
            ) : (
              <EmbroideryButton
                variant="secondary"
                threadColor="green"
                onClick={handleAdicionar}
                isLoading={busy === "adicionar"}
              >
                Adicionar
              </EmbroideryButton>
            )}

            {/* DENUNCIAR DE TROLL — laranja. */}
            <button
              onClick={() => setShowReport(true)}
              className="embroidery-thread-orange text-xs font-embroidery underline"
            >
              Denunciar de troll
            </button>
          </div>
        )}

        {actionError && <p className="text-xs text-red-700">{actionError}</p>}
      </section>

      <RodasSection profileUserId={id} />

      <EventosSection profileUserId={id} />

      <HomenagensSection
        profileUserId={id}
        isOwnProfile={isOwnProfile}
        isFriend={viewer?.isFriend ?? false}
      />

      {showReport && <ReportModal reportedUserId={id} onClose={() => setShowReport(false)} />}
    </main>
  );
}
