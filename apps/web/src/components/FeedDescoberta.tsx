"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { EVENTO_TIPOS, listEventosProximos, listRodasPublicas, type EventoResumo, type RodaPublica } from "@/lib/api";

const TIPO_ICON: Record<string, string> = {
  PRESENCIAL: "📍",
  ONLINE: "💻",
  CLUBE: "🎙️",
  ANALISE: "📚",
};

// Feed de descoberta: rodas e eventos criados por OUTRAS pessoas, para
// entrar/participar — distinto de MinhasAtividadesSection (que só mostra
// o que o próprio usuário já criou ou confirmou). Sem isso, o único jeito
// de conhecer uma roda/evento novo era already saber a URL de antemão.
// `limit` corta a lista para caber numa prévia (ex.: na home); a página
// /feed usa o mesmo componente sem limite, mostrando tudo.
export function FeedDescoberta({ limit }: { limit?: number }) {
  const { accessToken } = useAuth();
  const [rodas, setRodas] = useState<RodaPublica[] | null>(null);
  const [eventos, setEventos] = useState<EventoResumo[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listRodasPublicas(accessToken)
      .then(setRodas)
      .catch(() => setRodas([]));
    listEventosProximos(accessToken)
      .then(setEventos)
      .catch(() => setEventos([]));
  }, [accessToken]);

  const rodasExibidas = limit ? rodas?.slice(0, limit) : rodas;
  const eventosExibidos = limit ? eventos?.slice(0, limit) : eventos;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-2xl">Rodas para você entrar</h2>
          <Link href="/rodas" className="font-body text-xs underline text-embroidery-gray">
            ver todas
          </Link>
        </div>

        {rodasExibidas === null && <p className="font-body text-sm text-embroidery-gray">Carregando...</p>}
        {rodasExibidas?.length === 0 && (
          <p className="font-body text-sm text-embroidery-gray">Nenhuma roda pública ainda — que tal criar a primeira?</p>
        )}

        {rodasExibidas && rodasExibidas.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {rodasExibidas.map((roda) => (
              <Link
                key={roda.id}
                href={`/rodas/${roda.slug}`}
                className="flex flex-col items-center gap-2 p-3 bg-white/60 rounded-lg shadow-embroidery hover:shadow-embroidery-3d border-2 border-transparent hover:border-terracotta-400 transition-all"
              >
                {roda.imageUrl ? (
                  <img src={roda.imageUrl} alt={roda.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-linen-300 flex items-center justify-center text-2xl font-embroidery">
                    {roda.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="font-embroidery text-xs text-center line-clamp-2">{roda.name}</p>
                <p className="text-[10px] font-body text-embroidery-gray">
                  {roda._count.membros} {roda._count.membros === 1 ? "membro" : "membros"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-2xl">Eventos para participar</h2>
          <Link href="/eventos" className="font-body text-xs underline text-embroidery-gray">
            ver todos
          </Link>
        </div>

        {eventosExibidos === null && <p className="font-body text-sm text-embroidery-gray">Carregando...</p>}
        {eventosExibidos?.length === 0 && (
          <p className="font-body text-sm text-embroidery-gray">Nenhum evento marcado ainda — que tal criar o primeiro?</p>
        )}

        {eventosExibidos && eventosExibidos.length > 0 && (
          <ul className="flex flex-col gap-2">
            {eventosExibidos.map((evento) => {
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
                        {evento.organizer.profile?.displayName ? ` · por ${evento.organizer.profile.displayName}` : ""}
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
        )}
      </section>
    </div>
  );
}
