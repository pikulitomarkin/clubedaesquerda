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
  // Retalho do "ENTRAR", logo acima da etiqueta "Cadastre-se" bordada. O
  // vão livre entre o campo de senha (67,0%) e a etiqueta (70,4%) é de só
  // 3,4%, então o retalho encosta na borda de cima da etiqueta — lido como
  // pano costurado por cima, coerente com a colagem da arte.
  entrar: { left: "35%", top: "67.4%", width: "30%", height: "6.2%" },
  cadastre: { left: "20%", top: "74%", width: "60%", height: "15%" },
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

        {/* "ENTRAR": retalho de pano liso costurado acima do "Cadastre-se". */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="cloth-patch absolute flex items-center justify-center font-slab tracking-wide text-black transition-transform active:translate-y-[1px] disabled:opacity-70"
          style={{ ...CAMPOS.entrar, position: "absolute", fontSize: "3.6cqw" }}
        >
          {isSubmitting ? "ENTRANDO..." : "ENTRAR"}
        </button>

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

      {/* O "ENTRAR" agora é o retalho de pano dentro do bastidor (acima do
          "Cadastre-se"); aqui fica só o link de recuperação de senha. */}
      <div className="mt-3 flex justify-center">
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
