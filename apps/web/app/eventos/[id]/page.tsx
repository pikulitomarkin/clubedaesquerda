"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import {
  ApiError,
  cancelAttendance,
  confirmAttendance,
  EVENTO_TIPOS,
  getEvento,
  sendConvite,
  type Evento,
} from "@/lib/api";

const RECURRENCE_LABELS: Record<string, string> = {
  SEMANAL: "Toda semana",
  QUINZENAL: "A cada duas semanas",
  MENSAL: "Todo mês",
};

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, userId } = useAuth();
  const { subscribe } = useRealtime();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteId, setInviteId] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

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
  const isOrganizer = evento?.organizer.id === userId;
  const canInvite = isOrganizer || isConfirmed;

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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !inviteId.trim()) return;
    setInviteStatus(null);
    try {
      await sendConvite(id, inviteId.trim(), accessToken);
      setInviteStatus("Convite enviado!");
      setInviteId("");
    } catch (err) {
      setInviteStatus(err instanceof ApiError ? err.message : "Não foi possível enviar o convite");
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">{error}</p>
      </main>
    );
  }

  if (!evento) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">Carregando...</p>
      </main>
    );
  }

  const tipoLabel = EVENTO_TIPOS.find((t) => t.value === evento.tipo)?.label ?? evento.tipo;
  const start = new Date(evento.startsAt);

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <EmbroideryLogo size="sm" />

      <section className="w-full max-w-md p-6 bg-white/80 rounded-lg shadow-embroidery">
        <h1 className="font-heading text-3xl mb-1">{evento.title}</h1>
        <p className="text-xs font-body text-embroidery-gray mb-2">
          {tipoLabel} · organizado por {evento.organizer.profile?.displayName ?? "alguém"}
        </p>

        <p className="font-body text-sm mb-2">
          {start.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
        </p>

        {evento.recurrenceFrequency && (
          <p className="text-xs font-embroidery text-terracotta-700 mb-2">
            🔁 {RECURRENCE_LABELS[evento.recurrenceFrequency] ?? evento.recurrenceFrequency}
            {evento.recurrenceUntil
              ? ` até ${new Date(evento.recurrenceUntil).toLocaleDateString("pt-BR")}`
              : " · permanente"}
          </p>
        )}

        {evento.address && <p className="text-xs font-body mb-2">📍 {evento.address}</p>}
        {evento.onlineUrl && (
          <p className="text-xs font-body mb-2">
            🔗{" "}
            <a href={evento.onlineUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Link da reunião
            </a>
          </p>
        )}

        {evento.description && <p className="font-body text-sm mt-3 mb-3">{evento.description}</p>}

        <p className="text-xs font-body text-embroidery-gray mb-4">
          {evento.confirmedCount} confirmado{evento.confirmedCount !== 1 ? "s" : ""}
          {evento.capacity ? ` de ${evento.capacity} vagas` : ""}
        </p>

        <div className="flex flex-wrap gap-3">
          {isConfirmed ? (
            <EmbroideryButton variant="secondary" threadColor="black" onClick={handleCancel} isLoading={busy}>
              Cancelar presença
            </EmbroideryButton>
          ) : (
            <EmbroideryButton onClick={handleConfirm} isLoading={busy}>
              Confirmar presença
            </EmbroideryButton>
          )}
        </div>

        {error && <p className="text-xs text-red-700 mt-3">{error}</p>}
      </section>

      <section className="w-full max-w-md p-6 bg-white/80 rounded-lg shadow-embroidery">
        <h2 className="font-heading text-2xl mb-3">Confirmadíssim@s</h2>
        {(!evento.confirmacoes || evento.confirmacoes.length === 0) && (
          <p className="text-xs font-body text-embroidery-gray">Ninguém confirmou ainda.</p>
        )}
        <ul className="flex flex-col gap-2">
          {evento.confirmacoes?.map((c) => (
            <li key={c.userId} className="text-sm font-body">
              {c.user.profile?.displayName ?? "Alguém"}
            </li>
          ))}
        </ul>
      </section>

      {canInvite && (
        <section className="w-full max-w-md p-6 bg-white/80 rounded-lg shadow-embroidery">
          <h2 className="font-heading text-2xl mb-3">Convidar</h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              value={inviteId}
              onChange={(e) => setInviteId(e.target.value)}
              placeholder="ID do perfil a convidar"
              className="flex-1 rounded-md border border-linen-600 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-terracotta-400"
            />
            <EmbroideryButton type="submit" size="sm">
              Convidar
            </EmbroideryButton>
          </form>
          {inviteStatus && <p className="text-xs font-body mt-2">{inviteStatus}</p>}
        </section>
      )}
    </main>
  );
}
