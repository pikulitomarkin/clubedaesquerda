"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormField } from "@/components/FormField";
import { FormSelect } from "@/components/FormSelect";
import { FormTextarea } from "@/components/FormTextarea";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createRoda, uploadFile } from "@/lib/api";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Pública — qualquer pessoa pode entrar" },
  { value: "MEMBERS_ONLY", label: "Só membros do Clube da Esquerda" },
  { value: "INVITE_ONLY", label: "Só por convite" },
];

export default function NovaRodaPage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !name.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = (await uploadFile(imageFile, accessToken)).url;
      }

      const roda = await createRoda(
        { name: name.trim(), description: description.trim() || undefined, imageUrl, visibility },
        accessToken,
      );
      router.push(`/rodas/${roda.slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a roda");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex flex-col gap-4 p-8 bg-white/80 rounded-lg shadow-embroidery"
      >
        <h1 className="font-heading text-3xl text-center mb-2">Nova roda de conversa</h1>

        <FormField label="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />

        <FormTextarea
          label="Descrição (opcional)"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <label className="font-body text-xs font-semibold text-embroidery-dark">Imagem (opcional)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-xs font-body"
          />
        </div>

        <FormSelect
          label="Visibilidade"
          options={VISIBILITY_OPTIONS}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <EmbroideryButton type="submit" isLoading={submitting} disabled={!name.trim()}>
          Criar roda
        </EmbroideryButton>
      </form>
    </main>
  );
}
