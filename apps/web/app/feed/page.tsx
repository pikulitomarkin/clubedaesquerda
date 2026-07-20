"use client";

import { useAuth } from "@/lib/auth-context";

export default function FeedPage() {
  const { accessToken, emailVerified } = useAuth();

  return (
    <main className="min-h-screen bg-linen-texture p-8">
      <h1 className="font-heading text-4xl mb-4">Feed</h1>
      {!emailVerified && (
        <p className="font-body text-sm mb-4 bg-terracotta-100 border border-terracotta-400 rounded-md p-3">
          Confirme seu e-mail para liberar todos os recursos da plataforma.
        </p>
      )}
      <p className="font-body text-xs text-embroidery-gray">
        {accessToken ? "Sessão ativa." : "Sem sessão — faça login."}
      </p>
    </main>
  );
}
