"use client";

import { useEffect, useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { useAuth } from "@/lib/auth-context";
import { listPendingFriendRequests, respondFriendRequest, type FriendRequest } from "@/lib/api";

// Solicitações de amizade recebidas e ainda não respondidas — só aparece
// no próprio perfil (quem manda o pedido vê "Solicitação enviada" no
// perfil do outro, ver perfil/[id]/page.tsx). Aceitar libera o chat
// direto na hora; recusar só remove da lista.
export function FriendRequestsSection({ onChanged }: { onChanged?: () => void }) {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    if (!accessToken) return;
    try {
      setRequests(await listPendingFriendRequests(accessToken));
    } catch {
      setRequests([]);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleRespond(id: string, accept: boolean) {
    if (!accessToken) return;
    setBusy(id);
    try {
      await respondFriendRequest(id, accept, accessToken);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      onChanged?.();
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <section className="w-full max-w-md flex flex-col gap-3">
      <h2 className="font-heading text-2xl">Solicitações de amizade</h2>
      <ul className="flex flex-col gap-2">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 p-3 bg-white/60 rounded-md shadow-embroidery"
          >
            {r.requester.profile?.photoUrl ? (
              <img
                src={r.requester.profile.photoUrl}
                alt={r.requester.profile.displayName}
                className="h-10 w-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-linen-300 flex items-center justify-center text-sm font-embroidery shrink-0">
                {(r.requester.profile?.displayName ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <p className="font-embroidery text-sm flex-1 min-w-0 truncate">
              {r.requester.profile?.displayName ?? "Alguém"}
            </p>
            <EmbroideryButton
              size="sm"
              threadColor="green"
              onClick={() => handleRespond(r.id, true)}
              isLoading={busy === r.id}
            >
              Aceitar
            </EmbroideryButton>
            <button
              onClick={() => handleRespond(r.id, false)}
              disabled={busy === r.id}
              className="text-xs font-body underline text-embroidery-gray"
            >
              Recusar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
