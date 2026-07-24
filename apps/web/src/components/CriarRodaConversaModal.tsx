"use client";

import { useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { FormField } from "./FormField";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createGroupChat, uploadFile } from "@/lib/api";

// Popup do botão "RODA DE CONVERSA" acima da lista: seleciona várias
// pessoas (dentre os contatos diretos existentes — não há busca geral de
// usuários no produto, ver docs/contexto.md), nome e imagem da aba.
export function CriarRodaConversaModal({
  contatos,
  onClose,
  onCreated,
}: {
  contatos: Array<{ id: string; displayName: string; photoUrl: string | null }>;
  onClose: () => void;
  onCreated: (chatId: string) => void;
}) {
  const { accessToken } = useAuth();
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !accessToken) return;
    setUploadingImage(true);
    setError(null);
    try {
      const { url } = await uploadFile(file, accessToken);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar a imagem");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !name.trim() || selecionados.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const chat = await createGroupChat(
        { participantIds: selecionados, name: name.trim(), imageUrl: imageUrl ?? undefined },
        accessToken,
      );
      onCreated(chat.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a roda de conversa");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Roda de conversa"
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="stitched w-full max-w-md rounded-xl bg-linen-100 p-6 shadow-embroidery-3d flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-marker text-2xl text-center">Roda de Conversa</h2>

        <FormField label="Nome da roda" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />

        <div className="flex flex-col gap-1">
          <label className="font-body text-xs font-semibold text-embroidery-dark">Imagem (opcional)</label>
          <div className="flex items-center gap-3">
            {imageUrl && <img src={imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <label className="text-xs font-embroidery text-terracotta-700 underline cursor-pointer">
              {uploadingImage ? "Enviando..." : imageUrl ? "Trocar imagem" : "Escolher imagem"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={uploadingImage}
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold text-embroidery-dark">
            Quem participa ({selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"})
          </span>
          <div className="max-h-52 overflow-y-auto flex flex-col gap-1 border border-linen-400 rounded-md p-2">
            {contatos.length === 0 && (
              <p className="font-body text-xs text-embroidery-gray p-2">
                Você ainda não tem conversas diretas para adicionar a uma roda.
              </p>
            )}
            {contatos.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm font-body cursor-pointer p-1">
                <input
                  type="checkbox"
                  checked={selecionados.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                {c.displayName}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}

        <div className="flex gap-3">
          <EmbroideryButton
            type="submit"
            isLoading={submitting}
            disabled={!name.trim() || selecionados.length === 0}
          >
            Criar
          </EmbroideryButton>
          <button type="button" onClick={onClose} className="text-xs font-body underline">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

