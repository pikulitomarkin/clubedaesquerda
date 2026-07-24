"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BotaoVoltar } from "@/components/BotaoVoltar";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { ConvidarModal } from "@/components/ConvidarModal";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import {
  ApiError,
  CLUBE_TIPOS,
  DIAS_SEMANA,
  EVENTO_TIPOS,
  cancelAttendance,
  confirmAttendance,
  getEvento,
  type Evento,
} from "@/lib/api";

const RECURRENCE_LABELS: Record<string, string> = {
  RECORRENTE: "Recorrente",
  PERMANENTE: "Permanente",
};

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, userId } = useAuth();
  const { subscribe } = useRealtime();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showConvidar, setShowConvidar] = useState(false);

  async function refresh() {
    if (!accessToken) return;
    try {
      setEvento(await getEvento(id, accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? "Evento não encontrado (pode ter sido encerrado)" : "Erro ao carregar evento");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken]);

  // "CONFIRMADÍSSIM@S" ao vivo — ver docs/contexto.md § "Sistema de convites".
  useEffect(() => {
    return subscribe("evento:confirmacoes_atualizadas", (payload) => {
      const p = payload as { eventoId?: string };
      if (p.eventoId === id) refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isConfirmed = evento?.confirmacoes?.some((c) => c.userId === userId) ?? false;

  async function handleConfirm() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await confirmAttendance(id, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível confirmar presença");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!accessToken) return;
    setBusy(true);
    try {
      await cancelAttendance(id, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cancelar presença");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <BotaoVoltar />
        <p className="font-body">{error}</p>
      </main>
    );
  }

  if (!evento) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <BotaoVoltar />
        <p className="font-body">Carregando...</p>
      </main>
    );
  }

  const tipoLabel = EVENTO_TIPOS.find((t) => t.value === evento.tipo)?.label ?? evento.tipo;
  const start = new Date(evento.startsAt);
  const organizerLabel = evento.organizerName || evento.organizer.profile?.displayName || "alguém";

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <BotaoVoltar />
      <EmbroideryLogo size="sm" />

      <div className="w-full max-w-3xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {/* Em destaque: imagem de capa, nome, data/horário, recorrência, links */}
          <section className="bg-white/80 rounded-lg shadow-embroidery overflow-hidden">
            {evento.coverImageUrl && (
              <img src={evento.coverImageUrl} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <p className="text-[10px] font-body text-embroidery-gray uppercase tracking-wide mb-1">
                {tipoLabel}
                {evento.tipo === "CLUBE" && evento.clubeTipo
                  ? ` · ${CLUBE_TIPOS.find((c) => c.value === evento.clubeTipo)?.label ?? evento.clubeTipo}`
                  : ""}
              </p>
              <h1 className="font-heading text-3xl mb-2">{evento.title}</h1>

              <p className="font-body text-sm mb-1">
                {evento.dayOfWeek !== null
                  ? `Toda ${DIAS_SEMANA.find((d) => d.value === evento.dayOfWeek)?.label ?? ""} · ${start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : start.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
              </p>

              {evento.recurrenceMode !== "UNICO" && (
                <p className="text-xs font-embroidery text-terracotta-700 mb-2">
                  🔁 {RECURRENCE_LABELS[evento.recurrenceMode] ?? evento.recurrenceMode}
                  {evento.recurrenceText ? ` · ${evento.recurrenceText}` : ""}
                </p>
              )}

              <div className="flex flex-col gap-1 mt-2">
                {evento.onlineUrl && (
                  <a href={evento.onlineUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-body underline">
                    🔗 Acessar
                  </a>
                )}
                {evento.locationUrl && (
                  <a href={evento.locationUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-body underline">
                    📍 Ver localização
                  </a>
                )}
                {evento.ticketUrl && (
                  <a href={evento.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-body underline">
                    🎟️ {evento.isFree ? "Retirar ingresso" : "Comprar ingresso"}
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Descrição, organizador e localização */}
          <section className="bg-white/80 rounded-lg shadow-embroidery p-6 flex flex-col gap-3">
            {evento.description && (
              <div>
                <h2 className="font-body text-xs font-semibold text-embroidery-dark uppercase mb-1">Descrição</h2>
                <p className="font-body text-sm">{evento.description}</p>
              </div>
            )}

            <div>
              <h2 className="font-body text-xs font-semibold text-embroidery-dark uppercase mb-1">Organizador</h2>
              <Link href={`/perfil/${evento.organizer.id}`} className="font-body text-sm underline">
                {organizerLabel}
              </Link>
            </div>

            {(evento.locationName || evento.address) && (
              <div>
                <h2 className="font-body text-xs font-semibold text-embroidery-dark uppercase mb-1">Localização</h2>
                <p className="font-body text-sm">
                  {evento.locationName}
                  {evento.locationName && evento.address ? " — " : ""}
                  {evento.address}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-2">
              {isConfirmed ? (
                <EmbroideryButton variant="secondary" threadColor="black" onClick={handleCancel} isLoading={busy}>
                  Cancelar presença
                </EmbroideryButton>
              ) : (
                <EmbroideryButton onClick={handleConfirm} isLoading={busy}>
                  Confirmar presença
                </EmbroideryButton>
              )}
              <EmbroideryButton threadColor="mustard" variant="secondary" onClick={() => setShowConvidar(true)}>
                Convidar
              </EmbroideryButton>
            </div>

            {error && <p className="text-xs text-red-700">{error}</p>}
          </section>
        </div>

        {/* CONFIRMADÍSSIM@S */}
        <aside className="w-full md:w-64 shrink-0 bg-white/80 rounded-lg shadow-embroidery p-6 h-fit">
          <h2 className="font-heading text-xl mb-3">Confirmadíssim@s</h2>
          {(!evento.confirmacoes || evento.confirmacoes.length === 0) && (
            <p className="text-xs font-body text-embroidery-gray">Ninguém confirmou ainda.</p>
          )}
          <ul className="flex flex-col gap-3">
            {evento.confirmacoes?.map((c) => (
              <li key={c.userId} className="flex items-center gap-2">
                {c.user.profile?.photoUrl ? (
                  <img src={c.user.profile.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-linen-300" />
                )}
                <span className="text-sm font-body">{c.user.profile?.displayName ?? "Alguém"}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {showConvidar && <ConvidarModal eventoId={id} onClose={() => setShowConvidar(false)} />}
    </main>
  );
}
