"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { SelecionarTipoEventoModal } from "@/components/SelecionarTipoEventoModal";
import { EventoFormModal } from "@/components/EventoFormModal";
import { useAuth } from "@/lib/auth-context";
import { EVENTO_TIPOS, listEventosProximos, type EventoResumo } from "@/lib/api";

const TIPO_ICON: Record<string, string> = {
  PRESENCIAL: "📍",
  ONLINE: "💻",
  CLUBE: "🎙️",
  ANALISE: "📚",
};

// Página inicial dos Eventos — destino do botão "EVENTOS" no perfil e do
// popup de criação (seleção de tipo → formulário específico → PUBLICAR).
export default function EventosIndexPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [eventos, setEventos] = useState<EventoResumo[] | null>(null);
  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [criarStep, setCriarStep] = useState<null | "tipo" | string>(null);

  function refresh() {
    if (!accessToken) return;
    listEventosProximos(accessToken, { q: q || undefined, tipo: tipoFiltro || undefined })
      .then(setEventos)
      .catch(() => setEventos([]));
  }

  useEffect(refresh, [accessToken, q, tipoFiltro]);

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <div className="flex items-center gap-4">
        <h1 className="font-heading text-3xl">Eventos</h1>
        <EmbroideryButton threadColor="mustard" size="sm" onClick={() => setCriarStep("tipo")}>
          Criar evento
        </EmbroideryButton>
      </div>

      <div className="w-full max-w-md flex flex-col gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar evento..."
          className="rounded-md border border-linen-600 bg-white/80 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-terracotta-400"
        />
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className="rounded-md border border-linen-600 bg-white/80 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-terracotta-400"
        >
          <option value="">Todos os tipos</option>
          {EVENTO_TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="w-full max-w-md flex flex-col gap-2">
        {eventos === null && <p className="font-body text-sm text-center">Carregando...</p>}

        {eventos?.length === 0 && (
          <p className="font-body text-sm text-center text-embroidery-gray">Nenhum evento encontrado.</p>
        )}

        {eventos?.map((evento) => {
          const start = new Date(evento.startsAt);
          return (
            <li key={evento.id}>
              <Link
                href={`/eventos/${evento.id}`}
                className="flex gap-3 p-3 bg-white/60 rounded-md shadow-embroidery hover:shadow-embroidery-3d transition-shadow"
              >
                {evento.coverImageUrl ? (
                  <img src={evento.coverImageUrl} alt="" className="h-16 w-16 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-linen-300 flex items-center justify-center text-2xl shrink-0">
                    {TIPO_ICON[evento.tipo] ?? "🗓️"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-embroidery text-sm truncate">
                    {evento.title}
                    {evento.recurrenceMode !== "UNICO" && " 🔁"}
                  </p>
                  <p className="text-[10px] font-body text-embroidery-gray uppercase tracking-wide">
                    {EVENTO_TIPOS.find((t) => t.value === evento.tipo)?.label ?? evento.tipo}
                  </p>
                  <p className="text-xs font-body text-embroidery-gray">
                    {start.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    {evento.city ? ` · ${evento.city}${evento.state ? `/${evento.state}` : ""}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {criarStep === "tipo" && (
        <SelecionarTipoEventoModal onClose={() => setCriarStep(null)} onSelect={(tipo) => setCriarStep(tipo)} />
      )}

      {criarStep && criarStep !== "tipo" && (
        <EventoFormModal
          tipo={criarStep}
          onClose={() => setCriarStep(null)}
          onCreated={(eventoId) => {
            setCriarStep(null);
            router.push(`/eventos/${eventoId}`);
          }}
        />
      )}
    </main>
  );
}
