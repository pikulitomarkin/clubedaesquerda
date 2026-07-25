"use client";

import { useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { FormField } from "./FormField";
import { FormSelect } from "./FormSelect";
import { FormTextarea } from "./FormTextarea";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  CLUBE_TIPOS,
  DIAS_SEMANA,
  RECURRENCE_MODES,
  createEvento,
  uploadFile,
  type CreateEventoInput,
} from "@/lib/api";
import { normalizeUrl } from "@/lib/url";

const TITULOS: Record<string, string> = {
  PRESENCIAL: "Evento presencial",
  ONLINE: "Evento online",
  CLUBE: "Clubes",
  ANALISE: "Análises",
};

const NOME_LABEL: Record<string, string> = {
  PRESENCIAL: "Nome do evento",
  ONLINE: "Nome do evento",
  CLUBE: "Nome do clube",
  ANALISE: "Nome do canal",
};

// Popup específico de cada tipo (Presencial/Online/Clube/Análise) — os
// campos exibidos mudam conforme `tipo`, mas é um único componente porque
// os quatro compartilham a maior parte dos campos (nome, organizador,
// descrição, imagem de capa etc.). Botão "PUBLICAR" ao final, conforme o spec.
export function EventoFormModal({
  tipo,
  onClose,
  onCreated,
}: {
  tipo: string;
  onClose: () => void;
  onCreated: (eventoId: string) => void;
}) {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<CreateEventoInput>({ tipo, title: "" });
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pago, setPago] = useState<"gratuito" | "pago">("gratuito");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CreateEventoInput>(key: K, value: CreateEventoInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !accessToken) return;
    setUploadingImage(true);
    setError(null);
    try {
      const { url } = await uploadFile(file, accessToken);
      setCoverImageUrl(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar a imagem");
    } finally {
      setUploadingImage(false);
    }
  }

  const temRecorrencia = tipo === "CLUBE" || tipo === "ANALISE";
  const temPagoGratuito = tipo === "PRESENCIAL" || tipo === "ONLINE" || tipo === "CLUBE";
  const recorrenciaMarcada = form.recurrenceMode === "RECORRENTE" || form.recurrenceMode === "PERMANENTE";

  function podeSubmeter() {
    if (!form.title.trim()) return false;
    if (tipo === "PRESENCIAL" && (!form.locationName?.trim() || !form.address?.trim() || !form.startsAt)) return false;
    if (tipo === "ONLINE" && (!form.onlineUrl?.trim() || !form.startsAt)) return false;
    if (tipo === "CLUBE" && (!form.clubeTipo || !form.startsAt)) return false;
    if (tipo === "ANALISE" && (form.dayOfWeek === undefined || !form.time)) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !podeSubmeter()) return;
    setSubmitting(true);
    setError(null);
    try {
      const evento = await createEvento(
        {
          ...form,
          coverImageUrl: coverImageUrl ?? undefined,
          isFree: temPagoGratuito ? pago === "gratuito" : undefined,
          recurrenceMode: temRecorrencia ? (form.recurrenceMode ?? "UNICO") : undefined,
          recurrenceText: recorrenciaMarcada ? form.recurrenceText : undefined,
        },
        accessToken,
      );
      onCreated(evento.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar o evento");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={TITULOS[tipo]}
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="stitched w-full max-w-lg rounded-xl bg-linen-100 p-6 shadow-embroidery-3d flex flex-col gap-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-marker text-2xl text-center">{TITULOS[tipo]}</h2>

        <FormField
          label={NOME_LABEL[tipo] ?? "Nome do evento"}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={150}
          required
        />

        <FormField
          label="Organizador"
          value={form.organizerName ?? ""}
          onChange={(e) => update("organizerName", e.target.value)}
          maxLength={150}
        />

        {(tipo === "CLUBE" || tipo === "ANALISE") && (
          <FormField
            label="Nome da obra"
            value={form.obraNome ?? ""}
            onChange={(e) => update("obraNome", e.target.value)}
            maxLength={150}
          />
        )}

        {tipo === "CLUBE" && (
          <FormSelect
            label="Tipo de clube"
            options={[...CLUBE_TIPOS]}
            value={form.clubeTipo ?? ""}
            onChange={(e) => update("clubeTipo", e.target.value)}
            required
          />
        )}

        {tipo === "PRESENCIAL" && (
          <>
            <FormField
              label="Nome do local"
              value={form.locationName ?? ""}
              onChange={(e) => update("locationName", e.target.value)}
              maxLength={150}
              required
            />
            <FormField
              label="Endereço do local"
              value={form.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              maxLength={300}
              required
            />
            <FormField
              label="Link da localização"
              type="url"
              value={form.locationUrl ?? ""}
              onChange={(e) => update("locationUrl", e.target.value)}
              onBlur={(e) => update("locationUrl", normalizeUrl(e.target.value))}
            />
          </>
        )}

        {(tipo === "ONLINE" || tipo === "CLUBE" || tipo === "ANALISE") && (
          <FormField
            label={tipo === "ANALISE" ? "Link da exibição ou da reunião" : tipo === "CLUBE" ? "Link da reunião" : "Link do evento"}
            type="url"
            value={form.onlineUrl ?? ""}
            onChange={(e) => update("onlineUrl", e.target.value)}
            onBlur={(e) => update("onlineUrl", normalizeUrl(e.target.value))}
            required={tipo === "ONLINE"}
          />
        )}

        {(tipo === "PRESENCIAL" || tipo === "ONLINE" || tipo === "CLUBE") && (
          <FormField
            label="Data e horário"
            type="datetime-local"
            value={form.startsAt ?? ""}
            onChange={(e) => update("startsAt", e.target.value)}
            required
          />
        )}

        {tipo === "ANALISE" && (
          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Dia da semana"
              options={DIAS_SEMANA.map((d) => ({ value: String(d.value), label: d.label }))}
              value={form.dayOfWeek !== undefined ? String(form.dayOfWeek) : ""}
              onChange={(e) => update("dayOfWeek", Number(e.target.value))}
              required
            />
            <FormField
              label="Horário"
              type="time"
              value={form.time ?? ""}
              onChange={(e) => update("time", e.target.value)}
              required
            />
          </div>
        )}

        <FormTextarea
          label="Descrição (até 200 caracteres)"
          rows={3}
          maxLength={200}
          value={form.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
        />

        {temRecorrencia && (
          <>
            <FormSelect
              label="Recorrência"
              options={[...RECURRENCE_MODES]}
              value={form.recurrenceMode ?? "UNICO"}
              onChange={(e) => update("recurrenceMode", e.target.value)}
            />
            {recorrenciaMarcada && (
              <FormField
                label="Quando se repete"
                value={form.recurrenceText ?? ""}
                onChange={(e) => update("recurrenceText", e.target.value)}
                maxLength={200}
                placeholder="Ex.: toda última sexta-feira do mês"
                required
              />
            )}
          </>
        )}

        {temPagoGratuito && (
          <div className="flex flex-col gap-1">
            <span className="font-body text-xs font-semibold text-embroidery-dark">Pago ou gratuito</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input type="radio" checked={pago === "gratuito"} onChange={() => setPago("gratuito")} />
                Gratuito
              </label>
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input type="radio" checked={pago === "pago"} onChange={() => setPago("pago")} />
                Pago
              </label>
            </div>
          </div>
        )}

        {temPagoGratuito && (
          <FormField
            label="Link para retirada ou compra do ingresso"
            type="url"
            value={form.ticketUrl ?? ""}
            onChange={(e) => update("ticketUrl", e.target.value)}
            onBlur={(e) => update("ticketUrl", normalizeUrl(e.target.value))}
          />
        )}

        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold text-embroidery-dark">Imagem de capa</span>
          <div className="flex items-center gap-3">
            {coverImageUrl && <img src={coverImageUrl} alt="" className="h-14 w-24 rounded object-cover" />}
            <label className="text-xs font-embroidery text-terracotta-700 underline cursor-pointer">
              {uploadingImage ? "Enviando..." : coverImageUrl ? "Trocar imagem" : "Escolher imagem"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingImage}
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}

        <div className="flex gap-3">
          <EmbroideryButton type="submit" threadColor="mustard" isLoading={submitting} disabled={!podeSubmeter()}>
            Publicar
          </EmbroideryButton>
          <button type="button" onClick={onClose} className="text-xs font-body underline">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
