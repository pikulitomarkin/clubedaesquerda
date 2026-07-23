"use client";

import { useState } from "react";
import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormField } from "@/components/FormField";
import { ApiError, forgotPassword } from "@/lib/api";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // A API sempre responde de forma genérica (não revela se o e-mail existe);
  // o frontend espelha isso — sucesso é sempre a mesma mensagem.
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o e-mail");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center justify-center gap-6 p-8">
      <EmbroideryLogo size="sm" />

      {done ? (
        <div className="w-full max-w-sm text-center p-8 bg-white/80 rounded-lg shadow-embroidery">
          <h1 className="font-heading text-2xl mb-3">Verifique seu e-mail</h1>
          <p className="font-body text-sm mb-6">
            Se houver uma conta com este e-mail, enviamos um link para redefinir a senha. O link
            expira em 1 hora.
          </p>
          <Link href="/login">
            <EmbroideryButton>Voltar para o login</EmbroideryButton>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm flex flex-col gap-4 p-8 bg-white/80 rounded-lg shadow-embroidery"
          noValidate
        >
          <h1 className="font-heading text-3xl text-center mb-1">Recuperar conta</h1>
          <p className="font-body text-xs text-center text-embroidery-dark mb-2">
            Informe o e-mail do seu cadastro e enviaremos um link para criar uma nova senha.
          </p>

          <FormField
            label="E-mail"
            type="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <p className="text-sm text-red-700">{error}</p>}

          <EmbroideryButton type="submit" isLoading={submitting} disabled={!email} className="mt-2">
            Enviar link de recuperação
          </EmbroideryButton>

          <p className="text-xs text-center font-body">
            Lembrou a senha?{" "}
            <Link href="/login" className="font-semibold underline">
              Entrar
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
