"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@clube/shared";
import { BotaoPano } from "./BotaoPano";
import { FormField } from "./FormField";
import { FormTextarea } from "./FormTextarea";
import { ApiError, createSugestao, loginUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Fluxo do botão "SUGIRA PRA NÓS" (home):
//   sem sessão -> etapa "login" -> ao autenticar cai no formulário
//   com sessão -> já abre no formulário
//   após enviar -> etapa de agradecimento
type Etapa = "login" | "form" | "obrigada";

export function SugestaoModal({ onClose }: { onClose: () => void }) {
  const { accessToken, setSession } = useAuth();
  const [etapa, setEtapa] = useState<Etapa>(accessToken ? "form" : "login");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sugira pra nós"
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="stitched w-full max-w-md rounded-xl bg-linen-100 p-8 shadow-embroidery-3d"
        onClick={(e) => e.stopPropagation()}
      >
        {etapa === "login" && <EtapaLogin onLogado={() => setEtapa("form")} setSession={setSession} />}
        {etapa === "form" && <EtapaForm onEnviada={() => setEtapa("obrigada")} />}
        {etapa === "obrigada" && (
          <div className="text-center">
            <h2 className="font-marker text-2xl mb-3">Sugestão enviada</h2>
            <p className="font-body text-sm mb-6">
              Obrigada por sua sugestão! Saiba que vamos ler e, oportunamente, respondê-la por
              email.
            </p>
            <BotaoPano onClick={onClose}>Fechar</BotaoPano>
          </div>
        )}

        {etapa !== "obrigada" && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-xs font-body underline text-embroidery-gray"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// Etapa 1 — precisa estar logado para sugerir (a resposta vai por e-mail).
function EtapaLogin({
  onLogado,
  setSession,
}: {
  onLogado: () => void;
  setSession: (token: string, verified: boolean) => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setErro(null);
    try {
      const { accessToken, emailVerified } = await loginUser(data);
      setSession(accessToken, emailVerified);
      onLogado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível entrar");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <h2 className="font-marker text-2xl text-center">Entre para sugerir</h2>
      <p className="font-body text-xs text-center text-embroidery-gray">
        Respondemos as sugestões por e-mail, por isso pedimos que entre na sua conta.
      </p>

      <FormField label="CPF" placeholder="000.000.000-00" {...register("cpf")} error={errors.cpf?.message} />
      <FormField label="Senha" type="password" {...register("password")} error={errors.password?.message} />

      {erro && <p className="text-sm text-red-700">{erro}</p>}

      <BotaoPano type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </BotaoPano>
    </form>
  );
}

// Etapa 2 — o formulário de sugestão em si.
function EtapaForm({ onEnviada }: { onEnviada: () => void }) {
  const { accessToken } = useAuth();
  const [sugiro, setSugiro] = useState("");
  const [porque, setPorque] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setEnviando(true);
    setErro(null);
    try {
      await createSugestao({ sugiro, porque: porque || undefined }, accessToken);
      onEnviada();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível enviar sua sugestão");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <h2 className="font-marker text-2xl text-center">Sugira pra nós</h2>

      <FormTextarea
        label="Eu sugiro que..."
        rows={3}
        maxLength={1000}
        value={sugiro}
        onChange={(e) => setSugiro(e.target.value)}
      />
      <FormTextarea
        label="Porque..."
        rows={3}
        maxLength={1000}
        value={porque}
        onChange={(e) => setPorque(e.target.value)}
      />

      {erro && <p className="text-sm text-red-700">{erro}</p>}

      <BotaoPano type="submit" disabled={enviando || sugiro.trim().length < 3}>
        {enviando ? "Enviando..." : "Enviar sugestão"}
      </BotaoPano>
    </form>
  );
}
