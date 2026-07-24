"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@clube/shared";
import { ApiError, loginUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Card de login usando a ARTE ORIGINAL do cliente (IMAGENS PROJETO/Login.jpg,
// com o xadrez de fundo removido -> /brand/login-card.png). Os campos e a
// etiqueta são inputs/links de verdade posicionados por cima, em % do card,
// nas coordenadas medidas na própria imagem — por isso acompanham qualquer
// tamanho de tela sem sair do lugar.
//
// As posições vêm da medição dos retângulos bordados no PNG (523x559).
// Retângulos medidos no PNG (522x557), com uma folga para o texto ficar
// dentro do pesponto e não encostar na borda bordada.
const CAMPOS = {
  cpf: { left: "29.8%", top: "45.3%", width: "40.6%", height: "6.0%" },
  senha: { left: "30.0%", top: "60.5%", width: "40.4%", height: "5.6%" },
  cadastre: { left: "20%", top: "69%", width: "60%", height: "19%" },
} as const;

export function LoginCardArte({ onLogado }: { onLogado?: () => void }) {
  const { setSession } = useAuth();
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
      onLogado?.();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível entrar");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-[460px]" noValidate>
      {/* containerType: as medidas em `cqw` fazem a fonte dos campos escalar
          junto com o card, mantendo o texto alinhado aos retângulos. */}
      <div className="relative w-full" style={{ containerType: "inline-size" }}>
        <img
          src="/brand/login-card.png"
          alt="Entre na Roda — CPF e senha"
          className="block w-full select-none"
          draggable={false}
        />

        <input
          {...register("cpf")}
          type="text"
          inputMode="numeric"
          aria-label="CPF"
          placeholder="000.000.000-00"
          className="absolute border-none bg-transparent text-center font-body font-semibold tracking-wide text-black outline-none placeholder:font-normal placeholder:text-black/40"
          style={{ ...CAMPOS.cpf, position: "absolute", fontSize: "4.2cqw" }}
        />

        <input
          {...register("password")}
          type="password"
          aria-label="Senha"
          className="absolute border-none bg-transparent text-center font-body font-semibold tracking-widest text-black outline-none"
          style={{ ...CAMPOS.senha, position: "absolute", fontSize: "4.2cqw" }}
        />

        {/* A palavra "Cadastre-se" já está bordada na arte; o link é só a
            área clicável por cima (texto acessível fica no aria-label). */}
        <Link
          href="/cadastro"
          aria-label="Cadastre-se"
          className="absolute rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-600"
          style={{ ...CAMPOS.cadastre, position: "absolute" }}
        />
      </div>

      {(errors.cpf || errors.password || erro) && (
        <p className="mt-3 rounded bg-white/80 px-3 py-2 text-center font-body text-sm text-red-700">
          {erro ?? errors.cpf?.message ?? errors.password?.message}
        </p>
      )}

      {/* A arte não tem botão de entrar — Enter no campo já envia, mas um
          botão explícito evita que o usuário fique sem saber como seguir.
          Fica logo abaixo do campo de senha, na mesma letra do "ENTRE NA
          RODA" bordado (font-slab), em tamanho discreto. */}
      <div className="mt-3 flex flex-col items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="font-slab text-base tracking-wide text-black underline decoration-black/70 decoration-2 underline-offset-[6px] transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          {isSubmitting ? "ENTRANDO..." : "ENTRAR"}
        </button>
        <Link
          href="/esqueci-senha"
          className="font-body text-xs text-embroidery-dark underline underline-offset-4"
        >
          Esqueci minha senha
        </Link>
      </div>
    </form>
  );
}
