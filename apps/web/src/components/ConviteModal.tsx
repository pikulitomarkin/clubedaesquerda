"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmbroideryButton } from "./EmbroideryButton";
import { useAuth } from "@/lib/auth-context";
import { ApiError, respondConvite } from "@/lib/api";

export interface PendingConvite {
  conviteId: string;
  eventoId: string;
  eventoTitle: string;
}

// Popup de confirmação/recusa de convite — ver docs/contexto.md §
// "Sistema de convites". Aparece tanto para convites que chegam ao vivo
// (evento realtime "convite:recebido") quanto para os que já estavam
// pendentes ao carregar o app (GET /convites/pendentes).
export function ConviteModal({
  convite,
  onDone,
}: {
  convite: PendingConvite;
  onDone: () => void;
}) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  async function handleRespond(accept: boolean) {
    if (!accessToken) return;
    setBusy(accept ? "accept" : "decline");
    try {
      await respondConvite(convite.conviteId, accept, accessToken);
      if (accept) router.push(`/eventos/${convite.eventoId}`);
    } catch (err) {
      // Convite pode ter sido resolvido por outra via (ex.: aceito a
      // partir de outro convite do mesmo evento) — não trava a UI.
      void (err instanceof ApiError ? err.message : err);
    } finally {
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-w-sm w-full text-center p-8 bg-linen-texture rounded-lg shadow-embroidery-3d embroidery-frame">
        <p className="font-embroidery text-2xl mb-2">Você foi convidad@!</p>
        <p className="font-body text-sm mb-6">
          para <strong>{convite.eventoTitle}</strong>
        </p>
        <div className="flex flex-col gap-3">
          <EmbroideryButton onClick={() => handleRespond(true)} isLoading={busy === "accept"}>
            Confirmar presença
          </EmbroideryButton>
          <EmbroideryButton
            variant="secondary"
            threadColor="black"
            onClick={() => handleRespond(false)}
            isLoading={busy === "decline"}
          >
            Recusar
          </EmbroideryButton>
        </div>
      </div>
    </div>
  );
}
