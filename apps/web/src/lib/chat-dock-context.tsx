"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface ChatMeta {
  id: string;
  title: string;
  imageUrl?: string | null;
}

interface ChatDockContextValue {
  openChats: ChatMeta[];
  openChat: (meta: ChatMeta) => void;
  closeChat: (chatId: string) => void;
}

const ChatDockContext = createContext<ChatDockContextValue | null>(null);

const MAX_OPEN_CHATS = 2;

// Ver docs/contexto.md § "Até 2 abas de chat abertas simultaneamente" —
// restrição só de UI: no máximo MAX_OPEN_CHATS janelas flutuantes ao
// mesmo tempo. Abrir uma a mais fecha a menos recentemente focada
// (posição 0 do array); reabrir uma já aberta só a traz para o final
// (mais recente), sem contar como uma nova aba.
export function ChatDockProvider({ children }: { children: ReactNode }) {
  const [openChats, setOpenChats] = useState<ChatMeta[]>([]);

  function openChat(meta: ChatMeta) {
    setOpenChats((prev) => {
      const withoutThis = prev.filter((c) => c.id !== meta.id);
      const next = [...withoutThis, meta];
      return next.length > MAX_OPEN_CHATS ? next.slice(next.length - MAX_OPEN_CHATS) : next;
    });
  }

  function closeChat(chatId: string) {
    setOpenChats((prev) => prev.filter((c) => c.id !== chatId));
  }

  return (
    <ChatDockContext.Provider value={{ openChats, openChat, closeChat }}>{children}</ChatDockContext.Provider>
  );
}

export function useChatDock() {
  const ctx = useContext(ChatDockContext);
  if (!ctx) throw new Error("useChatDock deve ser usado dentro de ChatDockProvider");
  return ctx;
}
