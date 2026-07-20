"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { ApiError, verifyEmail } from "@/lib/api";

type Status = "verifying" | "success" | "error";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link de verificação inválido.");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Não foi possível verificar seu e-mail.");
      });
  }, [token]);

  return (
    <div className="w-full max-w-md text-center p-8 bg-white/80 rounded-lg shadow-embroidery">
      {status === "verifying" && <p className="font-body">Verificando seu e-mail...</p>}

      {status === "success" && (
        <>
          <h1 className="font-heading text-3xl mb-4">E-mail confirmado!</h1>
          <p className="font-body mb-6">Sua conta está ativa. Você já pode entrar.</p>
          <Link href="/login">
            <EmbroideryButton>Ir para o login</EmbroideryButton>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="font-heading text-3xl mb-4">Não foi possível verificar</h1>
          <p className="font-body">{message}</p>
        </>
      )}
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center justify-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <Suspense fallback={<p className="font-body">Carregando...</p>}>
        <VerificarEmailContent />
      </Suspense>
    </main>
  );
}
