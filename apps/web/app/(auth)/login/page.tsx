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
    <main className="min-h-screen bg-linen-texture flex flex-col items-center justify-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm flex flex-col gap-4 p-8 bg-white/80 rounded-lg shadow-embroidery"
        noValidate
      >
        <h1 className="font-heading text-3xl text-center mb-2">Entrar</h1>

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
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </main>
  );
}
