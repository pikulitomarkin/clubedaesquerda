"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormTextarea } from "@/components/FormTextarea";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/lib/auth-context";
import { useChatDock } from "@/lib/chat-dock-context";
import {
  ApiError,
  closeRoda,
  createMesa,
  createPost,
  getRoda,
  joinRoda,
  leaveRoda,
  listPostsByRoda,
  type Post,
  type Roda,
} from "@/lib/api";

export default function RodaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { accessToken, userId } = useAuth();
  const { openChat } = useChatDock();

  const [roda, setRoda] = useState<Roda | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mesaName, setMesaName] = useState("");

  async function refresh() {
    if (!accessToken) return;
    try {
      const r = await getRoda(slug, accessToken);
      setRoda(r);
      setPosts(await listPostsByRoda(r.id, accessToken));
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
    try {
      await joinRoda(roda.id, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar na roda");
    } finally {
      setBusy(null);
    }
  }

  async function handleLeave() {
    if (!accessToken || !roda) return;
    if (!confirm("Sair desta roda de conversa?")) return;
    setBusy("leave");
    try {
      await leaveRoda(roda.id, accessToken);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível sair da roda");
      setBusy(null);
    }
  }

  async function handleClose() {
    if (!accessToken || !roda) return;
    if (!confirm("Fechar esta roda? Todo o histórico do chat será apagado para sempre.")) return;
    setBusy("close");
    try {
      await closeRoda(roda.id, accessToken);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível fechar a roda");
      setBusy(null);
    }
  }

  function handleOpenChat() {
    if (!roda?.chat) return;
    openChat({ id: roda.chat.id, title: roda.name, imageUrl: roda.imageUrl });
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !roda || !draft.trim()) return;
    setBusy("post");
    try {
      await createPost({ content: draft.trim(), rodaId: roda.id, visibility: "MEMBERS_ONLY" }, accessToken);
      setDraft("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateMesa(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !roda || !mesaName.trim()) return;
    setBusy("mesa");
    try {
      const mesa = await createMesa({ name: mesaName.trim(), rodaId: roda.id }, accessToken);
      router.push(`/mesas/${mesa.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a mesa");
      setBusy(null);
    }
  }

  function handlePostChanged(updated: Post) {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  if (error) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">{error}</p>
      </main>
    );
  }

  if (!roda) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      {roda.imageUrl ? (
        <img src={roda.imageUrl} alt={roda.name} className="w-32 h-32 rounded-full object-cover shadow-embroidery-3d" />
      ) : (
        <EmbroideryLogo size="sm" />
      )}

      <section className="w-full max-w-md text-center p-6 bg-white/80 rounded-lg shadow-embroidery">
        <h1 className="font-heading text-3xl mb-1">{roda.name}</h1>
        {roda.description && <p className="font-body text-sm mb-4">{roda.description}</p>}
        <p className="text-xs font-body text-embroidery-gray mb-4">
          {roda.membros.length} {roda.membros.length === 1 ? "membro" : "membros"}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          {!myMembership && (
            <EmbroideryButton onClick={handleJoin} isLoading={busy === "join"}>
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
      </section>

      {myMembership && (
        <section className="w-full max-w-md flex flex-col gap-2 p-4 bg-white/70 rounded-lg shadow-embroidery">
          <h2 className="font-heading text-xl mb-1">Criar uma mesa</h2>
          <form onSubmit={handleCreateMesa} className="flex gap-2">
            <input
              value={mesaName}
              onChange={(e) => setMesaName(e.target.value)}
              placeholder="Nome da mesa"
              className="flex-1 rounded-md border border-linen-600 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
            <EmbroideryButton type="submit" size="sm" isLoading={busy === "mesa"} disabled={!mesaName.trim()}>
              Criar
            </EmbroideryButton>
          </form>
        </section>
      )}

      {myMembership && (
        <section className="w-full max-w-md flex flex-col gap-4">
          <form onSubmit={handlePost} className="flex flex-col gap-2 p-4 bg-white/70 rounded-lg shadow-embroidery">
            <FormTextarea
              label="Publicar na roda"
              rows={3}
              maxLength={5000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <EmbroideryButton type="submit" size="sm" isLoading={busy === "post"} disabled={!draft.trim()}>
              Publicar
            </EmbroideryButton>
          </form>

          {posts.length === 0 && (
            <p className="text-xs font-body text-embroidery-gray text-center">Nenhum post ainda.</p>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} onChanged={handlePostChanged} />
          ))}
        </section>
      )}
    </main>
  );
}
