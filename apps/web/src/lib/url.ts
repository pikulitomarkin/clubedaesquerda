// Completa o protocolo quando o usuário digita só o domínio (ex.:
// "vintagedevstack.com.br" -> "https://vintagedevstack.com.br") — tanto o
// <input type="url"> nativo quanto o @IsUrl({ require_protocol: true }) do
// backend exigem esquema explícito, e é fácil esquecer de digitá-lo.
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
