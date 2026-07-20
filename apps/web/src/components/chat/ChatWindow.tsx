"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { listChatMessages, listEmojis, type ChatMessage, type CustomEmoji, type GifResult } from "@/lib/api";
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

  return (
    <div className="flex flex-col w-80 h-96 bg-linen-100 rounded-t-lg shadow-embroidery-3d overflow-hidden">
      <header className="flex items-center justify-between px-3 py-2 bg-terracotta-500 text-white">
        <span className="font-embroidery text-sm truncate">{meta.title}</span>
        <button onClick={onClose} aria-label="Fechar chat" className="text-lg leading-none">
          ×
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm font-body ${
              m.senderId === userId ? "self-end bg-terracotta-300" : "self-start bg-white"
            }`}
          >
            {m.type === "GIF" && m.mediaUrl ? (
              <img src={m.mediaUrl} alt="GIF" className="max-w-full rounded" />
            ) : (
              <MessageContent text={m.content ?? ""} emojis={emojis} />
            )}
          </div>
        ))}
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
