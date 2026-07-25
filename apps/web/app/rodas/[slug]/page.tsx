"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BotaoVoltar } from "@/components/BotaoVoltar";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { MusicaRodaPlayer } from "@/components/MusicaRodaPlayer";
import { MontarMesaModal } from "@/components/MontarMesaModal";
import { useAuth } from "@/lib/auth-context";
import { useChatDock } from "@/lib/chat-dock-context";
import { ApiError, closeRoda, getRoda, joinRoda, leaveRoda, type Roda } from "@/lib/api";

export default function RodaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { accessToken, userId } = useAuth();
  const { openChat } = useChatDock();

  const [roda, setRoda] = useState<Roda | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Erro de ação (entrar/sair/fechar) — separado de `error` (falha ao
  // carregar a página inteira): sem essa separação, uma ação que falhasse
  // fazia a página inteira sumir e virar uma tela em branco só com a
  // mensagem de erro, escondendo a roda que já tinha carregado certinho.
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showMontarMesa, setShowMontarMesa] = useState(false);

  async function refresh() {
    if (!accessToken) return;
    try {
      setRoda(await getRoda(slug, accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? "Roda não encontrada" : "Erro ao carregar roda");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, accessToken]);

  const myMembership = roda?.membros.find((m) => m.userId === userId);
  const isOwner = myMembership?.role === "OWNER";

  // Botão "ENTRAR NA RODA".
  async function handleJoin() {
    if (!accessToken || !roda) return;
    setBusy("join");
    setActionError(null);
    try {
      await joinRoda(roda.id, accessToken);
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível entrar na roda");
    } finally {
      setBusy(null);
    }
  }

  async function handleLeave() {
    if (!accessToken || !roda) return;
    if (!confirm("Sair desta roda?")) return;
    setBusy("leave");
    setActionError(null);
    try {
      await leaveRoda(roda.id, accessToken);
      router.push("/rodas");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível sair da roda");
      setBusy(null);
    }
  }

  async function handleClose() {
    if (!accessToken || !roda) return;
    if (!confirm("Fechar esta roda? Todo o histórico do chat será apagado para sempre.")) return;
    setBusy("close");
    setActionError(null);
    try {
      await closeRoda(roda.id, accessToken);
      router.push("/rodas");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível fechar a roda");
      setBusy(null);
    }
  }

  function handleOpenChat() {
    if (!roda?.chat) return;
    openChat({ id: roda.chat.id, title: roda.name, imageUrl: roda.imageUrl, isGroup: true });
  }

  if (error) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <BotaoVoltar />
        <p className="font-body">{error}</p>
      </main>
    );
  }

  if (!roda) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <BotaoVoltar />
        <p className="font-body">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <BotaoVoltar />
      <EmbroideryLogo size="sm" />

      {/* Em destaque: imagem de capa, nome, descrição */}
      <section className="w-full max-w-3xl text-center p-6 bg-white/80 rounded-lg shadow-embroidery">
        {roda.imageUrl ? (
          <img
            src={roda.imageUrl}
            alt={roda.name}
            className="w-32 h-32 mx-auto rounded-full object-cover shadow-embroidery-3d mb-3"
          />
        ) : (
          <div className="w-32 h-32 mx-auto rounded-full bg-linen-300 flex items-center justify-center text-4xl font-embroidery mb-3">
            {roda.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="font-heading text-3xl mb-1">{roda.name}</h1>
        {roda.description && <p className="font-body text-sm mb-4">{roda.description}</p>}

        <div className="flex flex-wrap justify-center gap-3">
          {!myMembership && (
            <EmbroideryButton threadColor="purple" onClick={handleJoin} isLoading={busy === "join"}>
              Entrar na roda
            </EmbroideryButton>
          )}
          {myMembership && (
            <EmbroideryButton onClick={handleOpenChat} threadColor="gold">
              Abrir chat
            </EmbroideryButton>
          )}
          {myMembership && !isOwner && (
            <EmbroideryButton variant="secondary" threadColor="black" onClick={handleLeave} isLoading={busy === "leave"}>
              Sair
            </EmbroideryButton>
          )}
          {isOwner && (
            <EmbroideryButton variant="secondary" threadColor="red" onClick={handleClose} isLoading={busy === "close"}>
              Fechar roda
            </EmbroideryButton>
          )}
        </div>

        {actionError && <p className="text-xs text-red-700 mt-3">{actionError}</p>}
      </section>

      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-6">
        {/* Lado esquerdo: descrição/organizador, montar mesa, mesas */}
        <div className="flex-1 flex flex-col gap-4">
          <section className="p-6 bg-white/80 rounded-lg shadow-embroidery flex flex-col gap-3">
            {roda.description && <p className="font-body text-sm">{roda.description}</p>}
            {roda.organizer && (
              <p className="text-xs font-body text-embroidery-gray">
                organizada por{" "}
                <Link href={`/perfil/${roda.organizer.id}`} className="underline">
                  {roda.organizer.profile?.displayName ?? "alguém"}
                </Link>
              </p>
            )}
          </section>

          <section className="p-6 bg-white/80 rounded-lg shadow-embroidery flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl">Mesas</h2>
              {myMembership && (
                <EmbroideryButton threadColor="purpura" size="sm" onClick={() => setShowMontarMesa(true)}>
                  Montar mesa
                </EmbroideryButton>
              )}
            </div>

            {roda.mesas.length === 0 && (
              <p className="text-xs font-body text-embroidery-gray">Nenhuma mesa criada ainda.</p>
            )}

            <ul className="flex flex-col gap-1">
              {roda.mesas.map((mesa) => (
                <li key={mesa.id}>
                  <Link href={`/mesas/${mesa.id}`} className="font-embroidery text-sm underline hover:text-terracotta-600">
                    {mesa.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Lado direito: música + giff, membros */}
        <aside className="w-full md:w-72 shrink-0 flex flex-col gap-4">
          {(roda.musicUrls.length > 0 || roda.gifUrl) && (
            <section className="p-4 bg-white/80 rounded-lg shadow-embroidery flex flex-col gap-3 items-center">
              {roda.musicUrls.length > 0 && <MusicaRodaPlayer urls={roda.musicUrls} />}
              {roda.gifUrl && <img src={roda.gifUrl} alt="" className="w-full rounded-md object-cover" />}
            </section>
          )}

          <section className="p-4 bg-white/80 rounded-lg shadow-embroidery">
            <h2 className="font-heading text-lg mb-2">
              Quem já entrou ({roda.membros.length})
            </h2>
            <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {roda.membros.map((m) => (
                <li key={m.userId}>
                  <Link href={`/perfil/${m.user.id}`} className="flex items-center gap-2 group">
                    {m.user.profile?.photoUrl ? (
                      <img src={m.user.profile.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-linen-300" />
                    )}
                    <span className="text-sm font-body group-hover:underline">
                      {m.user.profile?.displayName ?? "Alguém"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {showMontarMesa && (
        <MontarMesaModal
          rodaId={roda.id}
          onClose={() => setShowMontarMesa(false)}
          onCreated={(mesaId) => {
            setShowMontarMesa(false);
            router.push(`/mesas/${mesaId}`);
          }}
        />
      )}
    </main>
  );
}
