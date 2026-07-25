"use client";

import { useEffect, useState } from "react";
import { BotaoVoltar } from "@/components/BotaoVoltar";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { CriarRodaConversaModal } from "@/components/CriarRodaConversaModal";
import { useAuth } from "@/lib/auth-context";
import { useChatDock } from "@/lib/chat-dock-context";
import { listMyChats, type ChatSummary } from "@/lib/api";

// "Roda de Conversa" — página inicial do chat, alcançada só pelo próprio
// usuário (ver botão no perfil). As conversas de fato acontecem na dock
// flutuante (ChatDock); aqui é a lista para escolher qual abrir e o
// ponto de criação de novas rodas de conversa (grupos avulsos).
export default function ChatsInboxPage() {
  const { accessToken } = useAuth();
  const { openChat } = useChatDock();
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [showCriar, setShowCriar] = useState(false);

  function refresh() {
    if (!accessToken) return;
    listMyChats(accessToken)
      .then(setChats)
      .catch(() => setChats([]));
  }

  useEffect(refresh, [accessToken]);

  // Pool de seleção para uma nova roda de conversa: os contatos diretos já
  // existentes (não há busca geral de usuários — ver contexto.md).
  const contatosDiretos = (chats ?? [])
    .filter((c) => c.type === "DIRECT" && c.otherUser)
    .map((c) => ({
      id: c.otherUser!.id,
      displayName: c.otherUser!.profile?.displayName ?? "Alguém",
      photoUrl: c.otherUser!.profile?.photoUrl ?? null,
    }));

  function abrirChat(chat: ChatSummary) {
    const nome = chat.type === "DIRECT" ? (chat.otherUser?.profile?.displayName ?? "Conversa") : (chat.name ?? "Roda de Conversa");
    const imagem = chat.type === "DIRECT" ? chat.otherUser?.profile?.photoUrl : chat.imageUrl;
    openChat({
      id: chat.id,
      title: nome,
      imageUrl: imagem ?? undefined,
      isAdHocGroup: chat.type === "GROUP",
      isCreator: chat.isCreator,
      isGroup: chat.type === "GROUP",
    });
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <BotaoVoltar />
      <EmbroideryLogo size="sm" />
      <h1 className="font-heading text-3xl">Roda de Conversa</h1>

      <div className="w-full max-w-md flex flex-col gap-3">
        {/* Botão acima da lista, como no spec. */}
        <EmbroideryButton threadColor="blue" size="sm" onClick={() => setShowCriar(true)}>
          Roda de Conversa
        </EmbroideryButton>

        {chats === null && <p className="font-body text-sm text-center">Carregando...</p>}

        {chats?.length === 0 && (
          <p className="font-body text-sm text-center text-embroidery-gray">
            Você ainda não tem conversas. Curta, adicione alguém ou crie uma roda de conversa.
          </p>
        )}

        {/* Lista só com nomes, conforme o spec do cliente. */}
        <ul className="flex flex-col gap-1">
          {chats?.map((chat) => {
            const nome = chat.type === "DIRECT" ? (chat.otherUser?.profile?.displayName ?? "Conversa") : (chat.name ?? "Roda de Conversa");
            return (
              <li key={chat.id}>
                <button
                  onClick={() => abrirChat(chat)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-white/60 transition-colors"
                >
                  <span className="font-embroidery text-sm">{nome}</span>
                  {chat.type === "GROUP" && <span className="ml-2 text-[10px] font-body text-embroidery-gray">roda</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {showCriar && (
        <CriarRodaConversaModal
          contatos={contatosDiretos}
          onClose={() => setShowCriar(false)}
          onCreated={(chatId) => {
            setShowCriar(false);
            refresh();
            openChat({ id: chatId, title: "Roda de Conversa", isAdHocGroup: true, isCreator: true });
          }}
        />
      )}
    </main>
  );
}
