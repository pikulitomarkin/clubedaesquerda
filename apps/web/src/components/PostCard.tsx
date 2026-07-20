"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError, reactToPost, removeReaction, REACTION_TYPES, type Post, type ReactionTypeValue } from "@/lib/api";

// Post sempre vinculado ao autor (nunca anônimo — ver docs/contexto.md §
// "Posts nas Mesas"): o nome/foto do autor é sempre exibido com link
// direto para o perfil, nunca omitido condicionalmente.
export function PostCard({ post, onChanged }: { post: Post; onChanged: (updated: Post) => void }) {
  const { accessToken, userId } = useAuth();
  const [busy, setBusy] = useState<ReactionTypeValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReact(type: ReactionTypeValue) {
    if (!accessToken || busy) return;
    setBusy(type);
    setError(null);

    const isRemoving = post.viewerReaction === type;
    const prevCounts = post.reactionCounts;
    const prevReaction = post.viewerReaction;

    // Atualização otimista: uma reação por usuário por post (ver
    // docs/contexto.md § "Sistema de reações") — trocar de reação move a
    // contagem do tipo antigo pro novo, nunca soma nos dois.
    const nextCounts = { ...prevCounts };
    if (prevReaction) nextCounts[prevReaction] = Math.max(0, (nextCounts[prevReaction] ?? 1) - 1);
    if (!isRemoving) nextCounts[type] = (nextCounts[type] ?? 0) + 1;

    onChanged({ ...post, reactionCounts: nextCounts, viewerReaction: isRemoving ? null : type });

    try {
      if (isRemoving) {
        await removeReaction(post.id, accessToken);
      } else {
        await reactToPost(post.id, type, accessToken);
      }
    } catch (err) {
      onChanged({ ...post, reactionCounts: prevCounts, viewerReaction: prevReaction });
      setError(err instanceof ApiError ? err.message : "Não foi possível reagir");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="p-4 bg-white/70 rounded-lg shadow-embroidery">
      <Link href={`/perfil/${post.author.id}`} className="flex items-center gap-2 mb-2 group">
        {post.author.profile?.photoUrl ? (
          <img
            src={post.author.profile.photoUrl}
            alt={post.author.profile.displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-linen-300 flex items-center justify-center text-xs font-embroidery">
            {(post.author.profile?.displayName ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-embroidery text-sm group-hover:text-terracotta-600 transition-colors">
          {post.author.profile?.displayName ?? "Alguém"}
        </span>
      </Link>

      <p className="font-body text-sm whitespace-pre-wrap mb-3">{post.content}</p>

      {post.mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {post.mediaUrls.map((url) => (
            <img key={url} src={url} alt="" className="rounded-md w-full h-32 object-cover" />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {REACTION_TYPES.map((r) => {
          const count = post.reactionCounts[r.value] ?? 0;
          const active = post.viewerReaction === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => handleReact(r.value)}
              disabled={busy === r.value || post.author.id === userId}
              className={`text-xs font-embroidery px-2 py-1 rounded-full border transition-colors ${
                active
                  ? "bg-terracotta-500 text-white border-terracotta-600"
                  : "bg-linen-100 text-embroidery-dark border-linen-300 hover:border-terracotta-400"
              }`}
            >
              {r.label} {count > 0 && <span className="tabular-nums">{count}</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </article>
  );
}
