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
  const [showModal, setShowModal] = useState(false);

  async function refresh() {
    if (!accessToken) return;
    setHomenagens(await listHomenagens(profileUserId, accessToken));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId, accessToken]);

  async function toggleVisibility(id: string, visible: boolean) {
    if (!accessToken) return;
    await setHomenagemVisibility(id, visible, accessToken);
    await refresh();
  }

  return (
    <section className="w-full max-w-md flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl">Homenagens</h2>
        {/* "HOMENAGEAR" abre popup — só entre amigos mútuos, e não no
            próprio perfil. */}
        {isFriend && !isOwnProfile && (
          <EmbroideryButton variant="secondary" threadColor="green" size="sm" onClick={() => setShowModal(true)}>
            Homenagear
          </EmbroideryButton>
        )}
      </div>

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

      {showModal && (
        <HomenagearModal profileUserId={profileUserId} onClose={() => setShowModal(false)} onSent={refresh} />
      )}
    </section>
  );
}

// Popup de até 200 caracteres — "possível apenas para amigos adicionados
// mutuamente" (checado pelo caller via `isFriend`, e reforçado pela API).
function HomenagearModal({
  profileUserId,
  onClose,
  onSent,
}: {
  profileUserId: string;
  onClose: () => void;
  onSent: () => Promise<void>;
}) {
  const { accessToken } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createHomenagem(profileUserId, content.trim(), accessToken);
      await onSent();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar a homenagem");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Homenagear"
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="stitched w-full max-w-md rounded-xl bg-linen-100 p-6 shadow-embroidery-3d flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-marker text-2xl text-center">Homenagear</h2>

        <FormTextarea
          label="Deixe uma homenagem (até 200 caracteres)"
          maxLength={200}
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        <span className="text-xs font-body text-embroidery-gray text-right">{content.length}/200</span>

        {error && <p className="text-xs text-red-700">{error}</p>}

        <div className="flex gap-3">
          <EmbroideryButton type="submit" threadColor="green" isLoading={submitting} disabled={!content.trim()}>
            Homenagear
          </EmbroideryButton>
          <button type="button" onClick={onClose} className="text-xs font-body underline">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
