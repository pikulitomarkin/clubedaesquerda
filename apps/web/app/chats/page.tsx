"use client";

import { useEffect, useState } from "react";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { useAuth } from "@/lib/auth-context";
import { useChatDock } from "@/lib/chat-dock-context";
import { listMyChats, type ChatSummary } from "@/lib/api";

// "RODA DE CONVERSA" — página inicial do chat, alcançada só pelo próprio
// usuário (ver botão no perfil). As conversas de fato acontecem na dock
// flutuante (ChatDock); aqui é só a lista para escolher qual abrir.
export default function ChatsInboxPage() {
  const { accessToken } = useAuth();
  const { openChat } = useChatDock();
  const [chats, setChats] = useState<ChatSummary[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listMyChats(accessToken)
      .then(setChats)
      .catch(() => setChats([]));
  }, [accessToken]);

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <h1 className="font-heading text-3xl">Roda de Conversa</h1>

      <div className="w-full max-w-md flex flex-col gap-2">
        {chats === null && <p className="font-body text-sm text-center">Carregando...</p>}

        {chats?.length === 0 && (
          <p className="font-body text-sm text-center text-embroidery-gray">
            Você ainda não tem conversas. Curta ou adicione alguém para começar uma roda.
          </p>
        )}

        {chats?.map((chat) => {
          const nome = chat.type === "GROUP" ? (chat.roda?.name ?? "Roda") : (chat.otherUser?.profile?.displayName ?? "Conversa");
          const imagem = chat.type === "GROUP" ? chat.roda?.imageUrl : chat.otherUser?.profile?.photoUrl;

          return (
            <button
              key={chat.id}
              onClick={() => openChat({ id: chat.id, title: nome, imageUrl: imagem ?? undefined })}
              className="flex items-center gap-3 p-3 bg-white/70 rounded-lg shadow-embroidery hover:shadow-embroidery-3d text-left transition-shadow"
            >
              {imagem ? (
                <img src={imagem} alt={nome} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-linen-300 flex items-center justify-center text-lg">
                  {nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-embroidery text-sm truncate">{nome}</p>
                {chat.lastMessage?.content && (
                  <p className="font-body text-xs text-embroidery-gray truncate">{chat.lastMessage.content}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
