"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@clube/shared";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormField } from "@/components/FormField";
import { FormSelect } from "@/components/FormSelect";
import { BRAZILIAN_STATES, GENDER_OPTIONS } from "@/lib/constants";
import { ApiError, registerUser } from "@/lib/api";

export default function CadastroPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    try {
      await registerUser(data);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Não foi possível concluir o cadastro");
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <div className="max-w-md text-center p-8 bg-white/80 rounded-lg shadow-embroidery">
          <h1 className="font-heading text-3xl mb-4">Quase lá!</h1>
          <p className="font-body">
            Enviamos um e-mail de confirmação. Verifique sua caixa de entrada para ativar sua
            conta. Você será redirecionado para o login em instantes.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center justify-center gap-6 p-8">
      <EmbroideryLogo size="sm" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md flex flex-col gap-4 p-8 bg-white/80 rounded-lg shadow-embroidery"
        noValidate
      >
        <h1 className="font-heading text-3xl text-center mb-2">Criar conta</h1>

        <FormField
          label="Nome completo"
          {...register("displayName")}
          error={errors.displayName?.message}
        />

        <FormField
          label="Data de nascimento"
          type="date"
          {...register("birthDate")}
          error={errors.birthDate?.message}
        />

        <FormSelect
          label="Como você se identifica"
          options={GENDER_OPTIONS}
          {...register("gender")}
          error={errors.gender?.message}
        />

        <FormField
          label="E-mail"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField label="Cidade" {...register("city")} error={errors.city?.message} />
          </div>
          <FormSelect label="UF" options={BRAZILIAN_STATES} {...register("state")} error={errors.state?.message} />
        </div>

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

        <FormField
          label="Confirmar senha"
          type="password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <label className="flex items-start gap-2 text-xs font-body">
          <input type="checkbox" className="mt-0.5" {...register("acceptTerms")} />
          <span>
            Li e aceito os <Link href="/termos" className="underline">Termos de Uso</Link>
          </span>
        </label>
        {errors.acceptTerms && <p className="text-xs text-red-700">{errors.acceptTerms.message}</p>}

        <label className="flex items-start gap-2 text-xs font-body">
          <input type="checkbox" className="mt-0.5" {...register("acceptPrivacy")} />
          <span>
            Li e aceito a <Link href="/privacidade" className="underline">Política de Privacidade</Link>
          </span>
        </label>
        {errors.acceptPrivacy && <p className="text-xs text-red-700">{errors.acceptPrivacy.message}</p>}

        {serverError && <p className="text-sm text-red-700">{serverError}</p>}

        <EmbroideryButton type="submit" isLoading={isSubmitting} className="mt-2">
          Cadastrar
        </EmbroideryButton>

        <p className="text-xs text-center font-body">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold underline">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
