"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@clube/shared";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormField } from "@/components/FormField";
import { ApiError, loginUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    try {
      const { accessToken, emailVerified } = await loginUser(data);
      setSession(accessToken, emailVerified);
      router.push("/feed");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Não foi possível entrar");
    }
  }

  return (
    <main className="min-h-screen bg-linen-texture flex items-center justify-center p-6 sm:p-8">
      {/* Marca à esquerda e formulário à direita (empilha no mobile). */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 lg:gap-20">
        {/* O bastidor "pula"; a elipse abaixo encolhe/clareia em sincronia,
            criando a leitura de chão. Ver keyframes hop/hopShadow. */}
        <div className="flex shrink-0 flex-col items-center">
          <EmbroideryLogo size="xl" className="animate-hop" />
          <span
            aria-hidden="true"
            className="mt-3 h-3.5 w-52 rounded-[50%] bg-embroidery-black/30 blur-[4px] animate-hop-shadow"
          />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="stitched w-full max-w-sm flex flex-col gap-4 p-8 bg-linen-100/90 rounded-xl shadow-embroidery-3d"
          noValidate
        >
          <h1 className="font-marker text-4xl text-center text-embroidery-black mb-2">Entrar</h1>

          <FormField
            label="CPF"
            placeholder="000.000.000-00"
            {...register("cpf")}
            error={errors.cpf?.message}
          />

          <FormField
            label="Senha"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />

          {serverError && <p className="text-sm text-red-700">{serverError}</p>}

          <EmbroideryButton type="submit" isLoading={isSubmitting} className="mt-2">
            Entrar
          </EmbroideryButton>

          <p className="text-xs text-center font-body">
            <Link href="/esqueci-senha" className="underline">
              Esqueci minha senha
            </Link>
          </p>

          <p className="text-xs text-center font-body">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-handwritten text-base font-bold underline">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
