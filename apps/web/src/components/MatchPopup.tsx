"use client";

import { EmbroideryButton } from "./EmbroideryButton";
import { ConfettiBurst } from "./ConfettiBurst";
import { useAuth } from "@/lib/auth-context";
import { useChatDock } from "@/lib/chat-dock-context";

interface MatchUser {
  userId: string;
  displayName: string;
  photoUrl: string | null;
}

export interface MatchCreatedPayload {
  matchId: string;
  chatId: string;
  users: MatchUser[];
}

export function MatchPopup({ payload, onClose }: { payload: MatchCreatedPayload; onClose: () => void }) {
  const { userId } = useAuth();
  const { openChat } = useChatDock();
  const other = payload.users.find((u) => u.userId !== userId) ?? payload.users[0];

  return (
    <>
      {/* Sobrevoo de confete e purpurina — ver spec do popup de match. */}
      <ConfettiBurst />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="max-w-sm w-full text-center p-8 bg-linen-texture rounded-lg shadow-embroidery-3d embroidery-frame">
          <p className="font-embroidery text-4xl mb-2">Vocês deram match</p>
          {other && (
            <p className="font-body text-sm mb-6">
              Você e <strong>{other.displayName}</strong> curtiram um ao outro.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {/* Botão "CONVERSAR" — linha rosa goiaba, leva direto ao chat. */}
            <EmbroideryButton
              threadColor="guava"
              onClick={() => {
                onClose();
                openChat({ id: payload.chatId, title: other?.displayName ?? "Chat", imageUrl: other?.photoUrl });
              }}
            >
              Conversar
            </EmbroideryButton>
            <button onClick={onClose} className="text-xs font-body underline">
              Continuar navegando
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
