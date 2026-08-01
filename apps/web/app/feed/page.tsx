"use client";

import { BotaoVoltar } from "@/components/BotaoVoltar";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FeedDescoberta } from "@/components/FeedDescoberta";
import { MinhasAtividadesSection } from "@/components/MinhasAtividadesSection";
import { useAuth } from "@/lib/auth-context";

// Feed: o que existe na plataforma além do que o próprio usuário já
// criou/participa (isso fica em MinhasAtividadesSection) — rodas e
// eventos de outras pessoas, para entrar/participar. Também embutido de
// forma resumida na home (`/`) logo após o login; aqui é a versão
// completa, sem corte de itens.
export default function FeedPage() {
  const { accessToken, emailVerified } = useAuth();

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <BotaoVoltar />
      <EmbroideryLogo size="sm" />
      <h1 className="font-heading text-4xl">Feed</h1>

      {!emailVerified && (
        <p className="font-body text-sm w-full max-w-3xl bg-terracotta-100 border border-terracotta-400 rounded-md p-3">
          Confirme seu e-mail para liberar todos os recursos da plataforma.
        </p>
      )}

      {!accessToken && <p className="font-body text-sm text-embroidery-gray">Sem sessão — faça login.</p>}

      {accessToken && (
        <>
          <MinhasAtividadesSection />
          <FeedDescoberta />
        </>
      )}
    </main>
  );
}
