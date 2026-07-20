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
import { addFriend, ApiError, blockUser, getUser, swipe, type UserProfile } from "@/lib/api";

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

  async function handleBloquear() {
    if (!accessToken) return;
    if (!confirm("Bloquear este perfil? Vocês deixarão de se ver mutuamente.")) return;
    setBusy("bloquear");
    setActionError(null);
    try {
      await blockUser(id, accessToken);
      router.push("/feed");
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

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      {profile.profile?.photoUrl ? (
        <img
          src={profile.profile.photoUrl}
          alt={profile.profile.displayName}
          className="w-28 h-28 rounded-full object-cover shadow-embroidery-3d"
        />
      ) : (
        <EmbroideryLogo size="sm" />
      )}

      <section className="w-full max-w-md text-center p-6 bg-white/80 rounded-lg shadow-embroidery">
        <h1 className="font-heading text-3xl mb-1">{profile.profile?.displayName ?? "Perfil"}</h1>
        {profile.profile?.city && (
          <p className="font-body text-xs text-embroidery-gray mb-4">
            {profile.profile.city}
            {profile.profile.state ? `, ${profile.profile.state}` : ""}
          </p>
        )}
        {profile.profile?.bio && <p className="font-body text-sm mb-4">{profile.profile.bio}</p>}

        {isOwnProfile && (
          <Link href="/perfil/editar" className="inline-block">
            <EmbroideryButton variant="secondary" threadColor="black" size="sm">
              Editar perfil
            </EmbroideryButton>
          </Link>
        )}

        {!isOwnProfile && viewer && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {viewer.matchId ? (
              <EmbroideryButton threadColor="gold" disabled>
                Já é match
              </EmbroideryButton>
            ) : (
              <EmbroideryButton
                onClick={handleGostei}
                isLoading={busy === "gostei"}
                disabled={viewer.hasLiked}
              >
                {viewer.hasLiked ? "Curtido" : "Gostei"}
              </EmbroideryButton>
            )}

            <EmbroideryButton
              variant="secondary"
              threadColor="black"
              onClick={handleAdicionar}
              isLoading={busy === "adicionar"}
              disabled={viewer.isFriend}
            >
              {viewer.isFriend ? "Amigos" : "Adicionar"}
            </EmbroideryButton>

            <EmbroideryButton
              variant="secondary"
              threadColor="red"
              onClick={handleBloquear}
              isLoading={busy === "bloquear"}
            >
              Bloquear
            </EmbroideryButton>

            <button
              onClick={() => setShowReport(true)}
              className="text-xs font-body underline text-red-700"
            >
              Denunciar de troll
            </button>
          </div>
        )}

        {actionError && <p className="text-xs text-red-700 mt-3">{actionError}</p>}
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
