"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import {
  ApiError,
  closeGroupChat,
  leaveGroupChat,
  listChatMessages,
  listEmojis,
  type ChatMessage,
  type CustomEmoji,
  type GifResult,
} from "@/lib/api";
import type { ChatMeta } from "@/lib/chat-dock-context";
import { MessageContent } from "./MessageContent";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";

export function ChatWindow({ meta, onClose }: { meta: ChatMeta; onClose: () => void }) {
  const { accessToken, userId } = useAuth();
  const { subscribe, send } = useRealtime();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [emojis, setEmojis] = useState<CustomEmoji[]>([]);
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState<"emoji" | "gif" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    listChatMessages(meta.id, accessToken).then((msgs) => setMessages(msgs.reverse()));
    listEmojis(accessToken).then(setEmojis).catch(() => setEmojis([]));
  }, [meta.id, accessToken]);

  useEffect(() => {
    const unsubMessage = subscribe("chat:message", (payload) => {
      const message = payload as ChatMessage;
      if (message.chatId === meta.id) setMessages((prev) => [...prev, message]);
    });
    const unsubClosed = subscribe("roda:closed", (payload) => {
      const { chatId } = payload as { chatId?: string };
      if (chatId === meta.id) onClose();
    });
    return () => {
      unsubMessage();
      unsubClosed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    send("send_message", { chatId: meta.id, type: "TEXT", content: draft.trim() });
    setDraft("");
  }

  function handleGifSelect(gif: GifResult) {
    send("send_message", { chatId: meta.id, type: "GIF", mediaUrl: gif.url });
    setPickerOpen(null);
  }

  // "SAIR" — qualquer membro, exceto o criador. Fecha a janela localmente;
  // o servidor já removeu a participação.
  async function handleSair() {
    if (!accessToken) return;
    if (!confirm("Sair desta roda de conversa?")) return;
    try {
      await leaveGroupChat(meta.id, accessToken);
      onClose();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível sair da roda");
    }
  }

  // "FECHAR RODA" — só o criador. O chat some para todos: o próprio
  // criador fecha aqui, e os demais fecham ao receber o evento realtime
  // "roda:closed" (assinado logo acima).
  async function handleFecharRoda() {
    if (!accessToken) return;
    if (!confirm("Fechar esta roda de conversa? Ela desaparece para todos e os dados são descartados.")) return;
    try {
      await closeGroupChat(meta.id, accessToken);
      onClose();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Não foi possível fechar a roda");
    }
  }

  return (
    <div className="flex flex-col w-80 h-96 bg-linen-100 rounded-t-lg shadow-embroidery-3d overflow-hidden">
      <header className="relative flex items-center justify-between px-3 py-2 bg-terracotta-500 text-white">
        <span className="font-embroidery text-sm truncate">{meta.title}</span>
        <div className="flex items-center gap-2">
          {/* Menu Sair/Fechar roda — só para roda de conversa avulsa. */}
          {meta.isAdHocGroup && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Opções da roda"
              className="text-lg leading-none"
            >
              ⋮
            </button>
          )}
          <button onClick={onClose} aria-label="Fechar chat" className="text-lg leading-none">
            ×
          </button>
        </div>

        {menuOpen && meta.isAdHocGroup && (
          <div className="absolute right-2 top-full mt-1 z-10 bg-white text-embroidery-black rounded-md shadow-embroidery-3d overflow-hidden">
            {meta.isCreator ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleFecharRoda();
                }}
                className="embroidery-thread-orange block w-full px-4 py-2 text-left text-xs font-embroidery whitespace-nowrap hover:bg-linen-100"
              >
                Fechar roda
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSair();
                }}
                className="block w-full px-4 py-2 text-left text-xs font-embroidery whitespace-nowrap hover:bg-linen-100"
              >
                Sair
              </button>
            )}
          </div>
        )}
      </header>

      {actionError && (
        <p className="px-3 py-1 text-xs text-red-700 bg-red-50 border-b border-red-200">{actionError}</p>
      )}

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-2">
        {messages.map((m) => {
          // Nome de quem enviou — só faz sentido em roda/grupo (em DIRECT já
          // se sabe quem é o outro lado, pelo cabeçalho da própria conversa).
          const mostrarRemetente = meta.isGroup && m.senderId !== userId;
          return (
            <div key={m.id} className={`flex flex-col max-w-[80%] ${m.senderId === userId ? "self-end items-end" : "self-start items-start"}`}>
              {mostrarRemetente && (
                <span className="font-embroidery text-[10px] text-embroidery-gray px-1">
                  {m.sender.profile?.displayName ?? "Alguém"}
                </span>
              )}
              <div
                className={`px-3 py-2 rounded-lg text-sm font-body ${
                  m.senderId === userId ? "bg-terracotta-300" : "bg-white"
                }`}
              >
                {m.type === "GIF" && m.mediaUrl ? (
                  <img src={m.mediaUrl} alt="GIF" className="max-w-full rounded" />
                ) : (
                  <MessageContent text={m.content ?? ""} emojis={emojis} />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="relative flex items-center gap-1 p-2 border-t border-linen-400 bg-white">
        {pickerOpen === "emoji" && (
          <EmojiPicker
            onSelect={(token) => setDraft((d) => d + token)}
            onClose={() => setPickerOpen(null)}
          />
        )}
        {pickerOpen === "gif" && <GifPicker onSelect={handleGifSelect} onClose={() => setPickerOpen(null)} />}

        <button
          type="button"
          onClick={() => setPickerOpen(pickerOpen === "emoji" ? null : "emoji")}
          className="text-lg px-1"
          aria-label="Emojis"
        >
          🙂
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(pickerOpen === "gif" ? null : "gif")}
          className="text-xs font-embroidery px-1"
          aria-label="GIFs"
        >
          GIF
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escreva..."
          className="flex-1 rounded-md border border-linen-600 px-2 py-1 text-sm font-body focus:outline-none focus:ring-2 focus:ring-terracotta-400"
        />
        <button type="submit" className="text-xs font-embroidery px-2 text-terracotta-700">
          Enviar
        </button>
      </form>
    </div>
  );
}
