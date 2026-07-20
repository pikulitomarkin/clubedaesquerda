import { z } from "zod";

// Fonte única de verdade para forma dos dados de auth trafegados entre
// apps/web (formulários) e apps/api (DTOs). Ver docs/architecture.md
// § "Fronteiras e comunicação".

export const genderEnum = z.enum([
  "MULHER_CIS",
  "HOMEM_CIS",
  "MULHER_TRANS",
  "HOMEM_TRANS",
  "NAO_BINARIE",
  "OUTRO",
  "PREFIRO_NAO_INFORMAR",
]);

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "Nome muito curto"),
    birthDate: z.string().date("Data de nascimento inválida"),
    email: z.string().email("E-mail inválido"),
    city: z.string().min(2, "Informe a cidade"),
    state: z
      .string()
      .length(2, "UF deve ter 2 letras")
      .transform((s) => s.toUpperCase()),
    cpf: z.string().regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
    password: z
      .string()
      .min(10, "Senha deve ter ao menos 10 caracteres")
      .max(128, "Senha deve ter no máximo 128 caracteres"),
    confirmPassword: z.string(),
    gender: genderEnum,
    // Consentimento explícito (LGPD): ambos precisam ser true para cadastrar.
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar os Termos de Uso" }),
    }),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: "É necessário aceitar a Política de Privacidade" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  cpf: z.string().min(1, "Informe o CPF"),
  password: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;
