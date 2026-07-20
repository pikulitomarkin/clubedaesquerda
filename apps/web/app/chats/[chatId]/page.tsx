"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatDock } from "@/lib/chat-dock-context";

// Deep-link de fallback (ex.: link antigo, notificação por e-mail): o
// chat de verdade vive na dock flutuante (ver ChatDock), não numa
// página própria — isso só abre a aba correspondente e volta para o
// feed.
export default function ChatDeepLinkPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const router = useRouter();
  const { openChat } = useChatDock();

  useEffect(() => {
    openChat({ id: chatId, title: "Chat" });
    router.replace("/feed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  return null;
}
