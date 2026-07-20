"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormField } from "@/components/FormField";
import { FormSelect } from "@/components/FormSelect";
import { FormTextarea } from "@/components/FormTextarea";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createEvento, EVENTO_TIPOS, RECURRENCE_OPTIONS, type CreateEventoInput } from "@/lib/api";

const initialState: CreateEventoInput = {
  title: "",
  description: "",
  tipo: "PRESENCIAL",
  startsAt: "",
};

export default function NovoEventoPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [form, setForm] = useState<CreateEventoInput>(initialState);
  const [recurrence, setRecurrence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CreateEventoInput>(key: K, value: CreateEventoInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !form.title.trim() || !form.startsAt) return;
    setSubmitting(true);
    setError(null);

    try {
      const evento = await createEvento(
        {
          ...form,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          recurrenceFrequency: recurrence || undefined,
        },
        accessToken,
      );
      router.push(`/eventos/${evento.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar o evento");
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
        <h1 className="font-heading text-3xl text-center mb-2">Novo evento</h1>

        <FormField
          label="Título"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={150}
          required
        />

        <FormTextarea
          label="Descrição (opcional)"
          rows={3}
          maxLength={5000}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <FormSelect
          label="Tipo"
          options={[...EVENTO_TIPOS]}
          value={form.tipo}
          onChange={(e) => update("tipo", e.target.value)}
        />

        {form.tipo === "PRESENCIAL" && (
          <FormField
            label="Endereço"
            value={form.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
            required
          />
        )}

        {form.tipo === "ONLINE" && (
          <FormField
            label="Link da reunião"
            type="url"
            value={form.onlineUrl ?? ""}
            onChange={(e) => update("onlineUrl", e.target.value)}
            required
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Início"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => update("startsAt", e.target.value)}
            required
          />
          <FormField
            label="Término (opcional)"
            type="datetime-local"
            value={form.endsAt ?? ""}
            onChange={(e) => update("endsAt", e.target.value)}
          />
        </div>

        <FormField
          label="Capacidade (opcional)"
          type="number"
          min={1}
          value={form.capacity ?? ""}
          onChange={(e) => update("capacity", e.target.value ? Number(e.target.value) : undefined)}
        />

        <FormSelect
          label="Repetição"
          options={[...RECURRENCE_OPTIONS]}
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
        />

        {recurrence && (
          <FormField
            label="Repetir até (opcional — em branco = permanente)"
            type="date"
            value={form.recurrenceUntil ?? ""}
            onChange={(e) => update("recurrenceUntil", e.target.value)}
          />
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        <EmbroideryButton type="submit" isLoading={submitting} disabled={!form.title.trim() || !form.startsAt}>
          Criar evento
        </EmbroideryButton>
      </form>
    </main>
  );
}
