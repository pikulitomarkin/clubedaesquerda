"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { BotaoPano } from "@/components/BotaoPano";
import { useAuth } from "@/lib/auth-context";
import { listEventosProximos, type EventoResumo } from "@/lib/api";

const TIPO_ICON: Record<string, string> = {
  PRESENCIAL: "📍",
  ONLINE: "💻",
  CLUBE: "🎙️",
  ANALISE: "📚",
};

// Página inicial dos Eventos — destino do botão "EVENTOS" no perfil.
export default function EventosIndexPage() {
  const { accessToken } = useAuth();
  const [eventos, setEventos] = useState<EventoResumo[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listEventosProximos(accessToken)
      .then(setEventos)
      .catch(() => setEventos([]));
  }, [accessToken]);

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <div className="flex items-center gap-4">
        <h1 className="font-heading text-3xl">Eventos</h1>
        <BotaoPano href="/eventos/novo" size="sm">
          Criar evento
        </BotaoPano>
      </div>

      <ul className="w-full max-w-md flex flex-col gap-2">
        {eventos === null && <p className="font-body text-sm text-center">Carregando...</p>}

        {eventos?.length === 0 && (
          <p className="font-body text-sm text-center text-embroidery-gray">
            Nenhum evento programado ainda.
          </p>
        )}

        {eventos?.map((evento) => {
          const start = new Date(evento.startsAt);
          return (
            <li key={evento.id}>
              <Link
                href={`/eventos/${evento.id}`}
                className="block p-3 bg-white/60 rounded-md shadow-embroidery hover:shadow-embroidery-3d transition-shadow"
              >
                <p className="font-embroidery text-sm">
                  {TIPO_ICON[evento.tipo] ?? "🗓️"} {evento.title}
                  {evento.recurrenceFrequency && " 🔁"}
                </p>
                <p className="text-xs font-body text-embroidery-gray">
                  {start.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  {evento.city ? ` · ${evento.city}${evento.state ? `/${evento.state}` : ""}` : ""}
                </p>
                <p className="text-[10px] font-body text-embroidery-gray">
                  por {evento.organizer.profile?.displayName ?? "alguém"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
