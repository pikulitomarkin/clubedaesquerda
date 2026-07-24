"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { listRodasForUser, listEventosForUser, type RodaMembership, type Evento } from "@/lib/api";

interface Item {
  id: string;
  href: string;
  label: string;
  imageUrl: string | null;
}

// Tela após o login: rodas e eventos que o usuário criou, separados dos
// que só participa — para os dois vale a mesma distinção (organizador vs.
// membro/confirmado).
export function MinhasAtividadesSection() {
  const { accessToken, userId } = useAuth();
  const [rodas, setRodas] = useState<RodaMembership[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    if (!accessToken || !userId) return;
    listRodasForUser(userId, accessToken)
      .then(setRodas)
      .catch(() => setRodas([]));
    listEventosForUser(userId, accessToken)
      .then(setEventos)
      .catch(() => setEventos([]));
  }, [accessToken, userId]);

  if (!accessToken || !userId) return null;
  if (rodas.length === 0 && eventos.length === 0) return null;

  const rodasCriadas: Item[] = rodas
    .filter((r) => r.role === "OWNER")
    .map((r) => ({ id: r.id, href: `/rodas/${r.slug}`, label: r.name, imageUrl: r.imageUrl }));

  const rodasParticipando: Item[] = rodas
    .filter((r) => r.role !== "OWNER")
    .map((r) => ({ id: r.id, href: `/rodas/${r.slug}`, label: r.name, imageUrl: r.imageUrl }));

  const eventosCriados: Item[] = eventos
    .filter((e) => e.organizerId === userId)
    .map((e) => ({ id: e.id, href: `/eventos/${e.id}`, label: e.title, imageUrl: e.coverImageUrl }));

  const eventosParticipando: Item[] = eventos
    .filter((e) => e.organizerId !== userId)
    .map((e) => ({ id: e.id, href: `/eventos/${e.id}`, label: e.title, imageUrl: e.coverImageUrl }));

  return (
    <div className="w-full max-w-3xl grid gap-4 sm:grid-cols-2">
      <BlocoLista titulo="Rodas que criei" itens={rodasCriadas} vazio="Você ainda não criou nenhuma roda." />
      <BlocoLista titulo="Rodas que participo" itens={rodasParticipando} vazio="Você ainda não entrou em nenhuma roda." />
      <BlocoLista titulo="Eventos que criei" itens={eventosCriados} vazio="Você ainda não criou nenhum evento." />
      <BlocoLista
        titulo="Eventos que participo"
        itens={eventosParticipando}
        vazio="Você ainda não confirmou presença em eventos."
      />
    </div>
  );
}

function BlocoLista({ titulo, itens, vazio }: { titulo: string; itens: Item[]; vazio: string }) {
  return (
    <section className="p-4 bg-white/70 rounded-lg shadow-embroidery">
      <h2 className="font-heading text-xl mb-2">{titulo}</h2>
      {itens.length === 0 ? (
        <p className="text-xs font-body text-embroidery-gray">{vazio}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {itens.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-center gap-2 group">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-linen-300" />
                )}
                <span className="font-embroidery text-sm group-hover:underline">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
