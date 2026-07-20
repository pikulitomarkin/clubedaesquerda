"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { listEventosForUser, type Evento } from "@/lib/api";

const TIPO_ICON: Record<string, string> = {
  PRESENCIAL: "📍",
  ONLINE: "💻",
  CLUBE: "🎙️",
  ANALISE: "📚",
};

// Eventos do perfil: organizador, confirmado ou convite aceito — a API
// já filtra para até 1h após o término (ver docs/contexto.md §10.5), o
// componente só exibe o que recebe.
export function EventosSection({ profileUserId }: { profileUserId: string }) {
  const { accessToken } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    listEventosForUser(profileUserId, accessToken)
      .then(setEventos)
      .catch(() => setEventos([]));
  }, [profileUserId, accessToken]);

  if (eventos.length === 0) return null;

  return (
    <section className="w-full max-w-md flex flex-col gap-3">
      <h2 className="font-heading text-2xl">Eventos</h2>
      <ul className="flex flex-col gap-2">
        {eventos.map((evento) => {
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
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
