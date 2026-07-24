"use client";

import { useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { FormField } from "./FormField";
import { FormTextarea } from "./FormTextarea";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createMesa } from "@/lib/api";

// Popup do botão "MONTAR MESA": nome (30) + descrição (100) + "PUBLICAR
// MESA" (púrpura).
export function MontarMesaModal({
  rodaId,
  onClose,
  onCreated,
}: {
  rodaId: string;
  onClose: () => void;
  onCreated: (mesaId: string) => void;
}) {
  const { accessToken } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const mesa = await createMesa(
        { name: name.trim(), description: description.trim() || undefined, rodaId },
        accessToken,
      );
      onCreated(mesa.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar a mesa");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Montar mesa"
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="stitched w-full max-w-md rounded-xl bg-linen-100 p-6 shadow-embroidery-3d flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-marker text-2xl text-center">Montar mesa</h2>

        <FormField label="Nome da mesa" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} required />

        <FormTextarea
          label="Descrição"
          rows={3}
          maxLength={100}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="text-xs text-red-700">{error}</p>}

        <div className="flex gap-3">
          <EmbroideryButton type="submit" threadColor="purpura" isLoading={submitting} disabled={!name.trim()}>
            Publicar mesa
          </EmbroideryButton>
          <button type="button" onClick={onClose} className="text-xs font-body underline">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
