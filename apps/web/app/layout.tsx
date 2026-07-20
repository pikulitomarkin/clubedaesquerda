import type { Metadata } from "next";
import "@/styles/design-system.css";
import { AuthProvider } from "@/lib/auth-context";
import { ChatDockProvider } from "@/lib/chat-dock-context";
import { RealtimeProvider } from "@/lib/realtime-context";
import { ChatDock } from "@/components/chat/ChatDock";

export const metadata: Metadata = {
  title: "Clube da Esquerda",
  description: "Comunidade, encontros e rodas de conversa para a esquerda.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <ChatDockProvider>
            <RealtimeProvider>
              {children}
              <ChatDock />
            </RealtimeProvider>
          </ChatDockProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
