"use client";

import { useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { FormField } from "./FormField";
import { FormTextarea } from "./FormTextarea";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createRoda, uploadFile } from "@/lib/api";

const MAX_MUSICAS = 3;

// Popup do botão "CRIAR RODA": nome (50), descrição (200), imagem, gif e
// até 3 links de música. Botão "PUBLICAR RODA" ao final, conforme o spec.
export function CriarRodaModal({ onClose, onCreated }: { onClose: () => void; onCreated: (slug: string) => void }) {
  const { accessToken } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [musicUrls, setMusicUrls] = useState<string[]>(["", "", ""]);
  const [uploading, setUploading] = useState<"imagem" | "gif" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(kind: "imagem" | "gif", file: File | undefined) {
    if (!file || !accessToken) return;
    setUploading(kind);
    setError(null);
    try {
      const { url } = await uploadFile(file, accessToken);
      if (kind === "imagem") setImageUrl(url);
      else setGifUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o arquivo");
    } finally {
      setUploading(null);
    }
  }

  function updateMusica(index: number, value: string) {
    setMusicUrls((prev) => prev.map((m, i) => (i === index ? value : m)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const roda = await createRoda(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imageUrl ?? undefined,
          gifUrl: gifUrl ?? undefined,
          musicUrls: musicUrls.map((m) => m.trim()).filter(Boolean),
        },
        accessToken,
      );
      onCreated(roda.slug);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar a roda");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Criar roda"
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="stitched w-full max-w-lg rounded-xl bg-linen-100 p-6 shadow-embroidery-3d flex flex-col gap-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-marker text-2xl text-center">Criar roda</h2>

        <FormField
          label="Nome da roda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
        />

        <FormTextarea
          label="Descrição"
          rows={3}
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold text-embroidery-dark">Imagem da roda</span>
          <div className="flex items-center gap-3">
            {imageUrl && <img src={imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <label className="text-xs font-embroidery text-terracotta-700 underline cursor-pointer">
              {uploading === "imagem" ? "Enviando..." : imageUrl ? "Trocar imagem" : "Escolher imagem"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading === "imagem"}
                onChange={(e) => handleUpload("imagem", e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold text-embroidery-dark">Giff da roda</span>
          <div className="flex items-center gap-3">
            {gifUrl && <img src={gifUrl} alt="" className="h-12 w-12 rounded-md object-cover" />}
            <label className="text-xs font-embroidery text-terracotta-700 underline cursor-pointer">
              {uploading === "gif" ? "Enviando..." : gifUrl ? "Trocar giff" : "Escolher giff"}
              <input
                type="file"
                accept="image/gif"
                className="hidden"
                disabled={uploading === "gif"}
                onChange={(e) => handleUpload("gif", e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-body text-xs font-semibold text-embroidery-dark">Links de música (até 3)</span>
          {Array.from({ length: MAX_MUSICAS }).map((_, i) => (
            <FormField
              key={i}
              label={`Música ${i + 1}`}
              type="url"
              value={musicUrls[i] ?? ""}
              onChange={(e) => updateMusica(i, e.target.value)}
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}

        <div className="flex gap-3">
          <EmbroideryButton type="submit" threadColor="purple" isLoading={submitting} disabled={!name.trim()}>
            Publicar roda
          </EmbroideryButton>
          <button type="button" onClick={onClose} className="text-xs font-body underline">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
