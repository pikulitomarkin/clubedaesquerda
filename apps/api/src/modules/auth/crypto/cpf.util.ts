import { createHmac } from "node:crypto";

// Ver docs/contexto.md secao 1 e 2: CPF nunca é persistido em texto
// plano. Este módulo concentra normalização, validação e hashing.

export function normalizeCpf(rawCpf: string): string {
  return rawCpf.replace(/\D/g, "");
}

export function isValidCpf(rawCpf: string): boolean {
  const cpf = normalizeCpf(rawCpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i]! * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
}

export function cpfLast4(rawCpf: string): string {
  const cpf = normalizeCpf(rawCpf);
  return cpf.slice(-4);
}

// HMAC-SHA256 determinístico, usado para lookup/unicidade. O pepper vive
// em secret manager, nunca commitado (ver .env.example).
export function hashCpf(rawCpf: string, pepper: string): string {
  const cpf = normalizeCpf(rawCpf);
  return createHmac("sha256", pepper).update(cpf).digest("hex");
}
