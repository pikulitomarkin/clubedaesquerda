"use client";

import { useChatDock } from "@/lib/chat-dock-context";
import { ChatWindow } from "./ChatWindow";

// Até 2 janelas flutuantes, lado a lado, ancoradas no canto inferior
// direito — ver docs/contexto.md § "Até 2 abas de chat abertas
// simultaneamente".
export function ChatDock() {
  const { openChats, closeChat } = useChatDock();

  if (openChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 z-40 flex items-end gap-3">
      {openChats.map((meta) => (
        <ChatWindow key={meta.id} meta={meta} onClose={() => closeChat(meta.id)} />
      ))}
    </div>
  );
}
