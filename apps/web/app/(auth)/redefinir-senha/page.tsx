"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormField } from "@/components/FormField";
import { ApiError, resetPassword } from "@/lib/api";

function RedefinirSenhaContent() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Espelham as regras do backend (ResetPasswordDto) para feedback imediato,
  // sem substituir a validação do servidor.
  const localError =
    password.length > 0 && password.length < 10
      ? "A senha deve ter ao menos 10 caracteres"
      : confirmPassword.length > 0 && password !== confirmPassword
        ? "A confirmação não corresponde à senha"
        : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Link de recuperação inválido.");
      return;
    }
    if (localError) return;

    setSubmitting(true);
    setError(null);
    try {
      await resetPassword({ token, password, confirmPassword });
      setDone(true);
      // Redireciona para o login após um instante para o usuário ler a mensagem.
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível redefinir a senha");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center p-8 bg-white/80 rounded-lg shadow-embroidery">
        <h1 className="font-heading text-2xl mb-3">Link inválido</h1>
        <p className="font-body text-sm mb-6">
          Este link de recuperação é inválido. Solicite um novo.
        </p>
        <Link href="/esqueci-senha">
          <EmbroideryButton>Pedir novo link</EmbroideryButton>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm text-center p-8 bg-white/80 rounded-lg shadow-embroidery">
        <h1 className="font-heading text-2xl mb-3">Senha redefinida!</h1>
        <p className="font-body text-sm mb-6">
          Sua senha foi alterada e todas as sessões anteriores foram encerradas. Redirecionando para
          o login...
        </p>
        <Link href="/login">
          <EmbroideryButton>Ir para o login</EmbroideryButton>
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm flex flex-col gap-4 p-8 bg-white/80 rounded-lg shadow-embroidery"
      noValidate
    >
      <h1 className="font-heading text-3xl text-center mb-1">Nova senha</h1>
      <p className="font-body text-xs text-center text-embroidery-dark mb-2">
        Escolha uma nova senha para sua conta.
      </p>

      <FormField
        label="Nova senha"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <FormField
        label="Confirme a nova senha"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={localError ?? undefined}
      />

      {error && <p className="text-sm text-red-700">{error}</p>}

      <EmbroideryButton
        type="submit"
        isLoading={submitting}
        disabled={!password || !confirmPassword || !!localError}
        className="mt-2"
      >
        Redefinir senha
      </EmbroideryButton>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center justify-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <Suspense fallback={<p className="font-body">Carregando...</p>}>
        <RedefinirSenhaContent />
      </Suspense>
    </main>
  );
}
