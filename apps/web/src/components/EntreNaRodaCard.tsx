"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@clube/shared";
import { ApiError, loginUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Container de login fiel à arte do cliente: tábuas de madeira com moldura
// pespontada, "Entre na Roda" bordado em linha preta, rótulos CPF/Senha em
// linha laranja e o campo como linha de costura tracejada (sem caixa).
// "Cadastre-se" é uma etiqueta de tecido com linha vermelha.
//
// onLogado: a home mantém o usuário na própria página; a rota /login
// redireciona. Por isso o callback em vez de navegar aqui dentro.
export function EntreNaRodaCard({ onLogado }: { onLogado?: () => void }) {
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="wood-panel stitched-frame w-full max-w-md rounded-lg px-9 py-10 sm:px-12"
      noValidate
    >
      <h2 className="thread-text mb-9 text-center font-slab text-3xl tracking-tight text-[#15171d] sm:text-4xl">
        Entre na Roda
      </h2>

      <div className="flex flex-col gap-7">
        <CampoCosturado
          id="cpf"
          label="CPF"
          placeholder="000.000.000-00"
          {...register("cpf")}
          error={errors.cpf?.message}
        />
        <CampoCosturado
          id="senha"
          label="Senha"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
      </div>

      {erro && (
        <p className="mt-5 rounded bg-black/25 px-3 py-2 text-center text-sm text-[#ffd9d0]">{erro}</p>
      )}

      {/* Etiqueta "Cadastre-se" costurada na madeira, em linha vermelha. */}
      <div className="mt-9 flex flex-col items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="thread-text font-slab text-lg tracking-wide text-[#f6efe2] underline decoration-[#e08a48] decoration-4 underline-offset-8 disabled:opacity-60"
        >
          {isSubmitting ? "Entrando..." : "ENTRAR"}
        </button>

        <Link href="/cadastro" className="fabric-patch px-8 py-2.5">
          <span className="font-handwritten text-2xl font-bold text-[#b4231f]">Cadastre-se</span>
        </Link>

        <Link
          href="/esqueci-senha"
          className="font-body text-xs text-[#e9dcc6] underline underline-offset-4"
        >
          Esqueci minha senha
        </Link>
      </div>
    </form>
  );
}

// Rótulo bordado à esquerda + linha de costura à direita, como na arte.
// forwardRef é obrigatório: o `register` do react-hook-form entrega uma ref
// e sem ela o valor do campo não chega ao submit.
const CampoCosturado = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(({ label, id, error, ...props }, ref) => (
  <div>
    <div className="flex items-baseline gap-3">
      <label
        htmlFor={id}
        className="thread-text shrink-0 font-slab text-xl text-[#e08a48] sm:text-2xl"
      >
        {label}
      </label>
      <input ref={ref} id={id} className="stitch-input font-body text-base" {...props} />
    </div>
    {error && <p className="mt-1 pl-1 text-xs text-[#ffd9d0]">{error}</p>}
  </div>
));

CampoCosturado.displayName = "CampoCosturado";
