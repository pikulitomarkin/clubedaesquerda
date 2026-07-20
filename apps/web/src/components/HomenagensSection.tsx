"use client";

import { useEffect, useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { FormTextarea } from "./FormTextarea";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  createHomenagem,
  listHomenagens,
  setHomenagemVisibility,
  type Homenagem,
} from "@/lib/api";

export function HomenagensSection({
  profileUserId,
  isOwnProfile,
  isFriend,
}: {
  profileUserId: string;
  isOwnProfile: boolean;
  isFriend: boolean;
}) {
  const { accessToken } = useAuth();
  const [homenagens, setHomenagens] = useState<Homenagem[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    if (!accessToken) return;
    setHomenagens(await listHomenagens(profileUserId, accessToken));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId, accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createHomenagem(profileUserId, content.trim(), accessToken);
      setContent("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar a homenagem");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVisibility(id: string, visible: boolean) {
    if (!accessToken) return;
    await setHomenagemVisibility(id, visible, accessToken);
    await refresh();
  }

  return (
    <section className="w-full max-w-md flex flex-col gap-4">
      <h2 className="font-heading text-2xl">Homenagens</h2>

      {isFriend && !isOwnProfile && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FormTextarea
            label="Deixe uma homenagem (até 200 caracteres)"
            maxLength={200}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <span className="text-xs font-body text-embroidery-gray text-right">{content.length}/200</span>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <EmbroideryButton type="submit" size="sm" isLoading={submitting} disabled={!content.trim()}>
            Publicar
          </EmbroideryButton>
        </form>
      )}

      {homenagens.length === 0 && (
        <p className="text-xs font-body text-embroidery-gray">Nenhuma homenagem ainda.</p>
      )}

      <ul className="flex flex-col gap-3">
        {homenagens.map((h) => (
          <li key={h.id} className="p-3 bg-white/60 rounded-md shadow-embroidery">
            <p className="font-body text-sm">{h.content}</p>
            <p className="text-xs font-embroidery text-embroidery-gray mt-1">
              — {h.author.profile?.displayName ?? "Alguém"}
            </p>
            {isOwnProfile && (
              <button
                onClick={() => toggleVisibility(h.id, !h.visible)}
                className="text-xs underline mt-1 font-body"
              >
                {h.visible ? "Ocultar do meu perfil" : "Mostrar no meu perfil"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
