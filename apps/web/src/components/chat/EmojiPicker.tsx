"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listEmojis, type CustomEmoji } from "@/lib/api";

// Curadoria pequena de emojis unicode padrão — não precisam de backend,
// são só caracteres. Emojis personalizados (catálogo curado pela
// plataforma) vêm de GET /emojis.
const UNICODE_EMOJIS = [
  "😀", "😂", "😍", "🥹", "😎", "🤔", "😢", "😡", "👍", "👏",
  "🙌", "🤝", "✊", "❤️", "🔥", "🎉", "🙏", "😴", "🤗", "😮",
];

export function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (token: string) => void;
  onClose: () => void;
}) {
  const { accessToken } = useAuth();
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);

  useEffect(() => {
    if (accessToken) listEmojis(accessToken).then(setCustomEmojis).catch(() => setCustomEmojis([]));
  }, [accessToken]);

  return (
    <div className="absolute bottom-full mb-2 w-64 max-h-64 overflow-y-auto p-3 bg-white rounded-lg shadow-embroidery-3d border border-linen-400 z-10">
      <button onClick={onClose} className="text-xs float-right underline">
        fechar
      </button>

      <p className="text-xs font-body font-semibold mb-1">Emojis</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {UNICODE_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="text-lg hover:bg-linen-200 rounded p-1"
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {customEmojis.length > 0 && (
        <>
          <p className="text-xs font-body font-semibold mb-1">Personalizados</p>
          <div className="flex flex-wrap gap-1">
            {customEmojis.map((emoji) => (
              <button
                key={emoji.id}
                type="button"
                className="hover:bg-linen-200 rounded p-1"
                onClick={() => onSelect(`:${emoji.shortcode}:`)}
                title={`:${emoji.shortcode}:`}
              >
                <img src={emoji.imageUrl} alt={emoji.shortcode} className="h-6 w-6" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
