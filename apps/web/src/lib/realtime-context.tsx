"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { MatchPopup, type MatchCreatedPayload } from "@/components/MatchPopup";
import { ConviteModal, type PendingConvite } from "@/components/ConviteModal";
import { listPendingConvites } from "./api";

type RealtimeListener = (payload: unknown) => void;

interface RealtimeContextValue {
  subscribe: (event: string, listener: RealtimeListener) => () => void;
  send: (event: string, data: unknown) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3333";

// Uma única conexão WebSocket para o app inteiro (chat, popup de match,
// popup de convite, futuras notificações) — ver docs/contexto.md §
// "Entrega em tempo real". Reconecta automaticamente enquanto houver
// accessToken; outros componentes se inscrevem em eventos específicos
// via subscribe(), evitando que cada tela precise gerenciar sua própria
// conexão.
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<RealtimeListener>>>(new Map());
  const [matchPopup, setMatchPopup] = useState<MatchCreatedPayload | null>(null);
  const [conviteQueue, setConviteQueue] = useState<PendingConvite[]>([]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const socket = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(accessToken!)}`);
      socketRef.current = socket;

      socket.onmessage = (raw) => {
        try {
          const { event, payload } = JSON.parse(raw.data);
          if (event === "match:created") setMatchPopup(payload as MatchCreatedPayload);
          if (event === "convite:recebido") {
            const p = payload as { conviteId: string; eventoId: string; eventoTitle: string };
            setConviteQueue((prev) => [...prev, p]);
          }
          listenersRef.current.get(event)?.forEach((listener) => listener(payload));
        } catch {
          // mensagem malformada, ignora
        }
      };

      socket.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [accessToken]);

  // Convites que já estavam pendentes antes de conectar (ex.: enviados
  // enquanto o usuário estava offline) — o push em tempo real só cobre
  // quem já está conectado no momento do envio.
  useEffect(() => {
    if (!accessToken) return;
    listPendingConvites(accessToken)
      .then((convites) => {
        setConviteQueue((prev) => {
          const known = new Set(prev.map((c) => c.conviteId));
          const fromRest = convites
            .filter((c) => !known.has(c.id))
            .map((c) => ({ conviteId: c.id, eventoId: c.evento.id, eventoTitle: c.evento.title }));
          return [...prev, ...fromRest];
        });
      })
      .catch(() => {
        // Sem convites pendentes ou API indisponível — não bloqueia o app.
      });
  }, [accessToken]);

  function subscribe(event: string, listener: RealtimeListener) {
    if (!listenersRef.current.has(event)) listenersRef.current.set(event, new Set());
    listenersRef.current.get(event)!.add(listener);
    return () => listenersRef.current.get(event)?.delete(listener);
  }

  function send(event: string, data: unknown) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, data }));
    }
  }

  const currentConvite = conviteQueue[0] ?? null;

  return (
    <RealtimeContext.Provider value={{ subscribe, send }}>
      {children}
      {matchPopup && <MatchPopup payload={matchPopup} onClose={() => setMatchPopup(null)} />}
      {!matchPopup && currentConvite && (
        <ConviteModal convite={currentConvite} onDone={() => setConviteQueue((prev) => prev.slice(1))} />
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime deve ser usado dentro de RealtimeProvider");
  return ctx;
}
