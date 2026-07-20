// As chaves RS256 chegam por variável de ambiente, e um PEM tem múltiplas
// linhas — formato que arquivos .env (e o env do Docker Compose) não
// carregam. Por isso são armazenadas em base64, como o .env.example já
// documentava, e decodificadas aqui.
//
// Aceita também PEM cru, para não quebrar ambientes locais já configurados
// dessa forma.
export function decodePem(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("-----BEGIN")) return trimmed;

  const decoded = Buffer.from(trimmed, "base64").toString("utf8");
  if (!decoded.includes("-----BEGIN")) {
    throw new Error("Chave JWT inválida: não é PEM nem base64 de um PEM");
  }
  return decoded;
}
