"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { FormTextarea } from "@/components/FormTextarea";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  createPost,
  getMesa,
  joinMesa,
  listPostsByMesa,
  type Mesa,
  type Post,
} from "@/lib/api";

export default function MesaPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const [mesaData, postsData] = await Promise.all([
        getMesa(id, accessToken!),
        listPostsByMesa(id, accessToken!),
      ]);
      setMesa(mesaData);
      setPosts(postsData);
    } catch (err) {
      setError(err instanceof ApiError ? "Mesa não encontrada" : "Erro ao carregar mesa");
    }
  }

  useEffect(() => {
    if (!accessToken) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken]);

  async function handleJoin() {
    if (!accessToken) return;
    setBusy(true);
    try {
      await joinMesa(id, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar na mesa");
    } finally {
      setBusy(false);
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createPost({ content: draft.trim(), mesaId: id, visibility: "MEMBERS_ONLY" }, accessToken);
      setDraft("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar");
    } finally {
      setBusy(false);
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

  if (!mesa) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <section className="w-full max-w-md text-center p-6 bg-white/80 rounded-lg shadow-embroidery">
        {mesa.roda && (
          <Link href={`/rodas/${mesa.roda.slug}`} className="text-xs font-body underline text-embroidery-gray">
            {mesa.roda.name}
          </Link>
        )}
        {mesa.evento && <p className="text-xs font-body text-embroidery-gray">{mesa.evento.title}</p>}
        <h1 className="font-heading text-3xl mt-1 mb-2">{mesa.name}</h1>
        <p className="text-xs font-body text-embroidery-gray mb-3">
          {mesa._count.participantes} participante{mesa._count.participantes !== 1 ? "s" : ""}
          {mesa.capacity ? ` de ${mesa.capacity}` : ""}
        </p>
        <EmbroideryButton size="sm" onClick={handleJoin} isLoading={busy}>
          Participar da mesa
        </EmbroideryButton>
      </section>

      <section className="w-full max-w-md flex flex-col gap-4">
        <form onSubmit={handlePost} className="flex flex-col gap-2 p-4 bg-white/70 rounded-lg shadow-embroidery">
          <FormTextarea
            label="Publicar na mesa"
            rows={3}
            maxLength={5000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          {error && <p className="text-xs text-red-700">{error}</p>}
          <EmbroideryButton type="submit" size="sm" isLoading={busy} disabled={!draft.trim()}>
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
    </main>
  );
}
