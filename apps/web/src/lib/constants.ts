export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
].map((uf) => ({ value: uf, label: uf }));

export const GENDER_OPTIONS = [
  { value: "MULHER_CIS", label: "Mulher cis" },
  { value: "HOMEM_CIS", label: "Homem cis" },
  { value: "MULHER_TRANS", label: "Mulher trans" },
  { value: "HOMEM_TRANS", label: "Homem trans" },
  { value: "NAO_BINARIE", label: "Não-binárie" },
  { value: "OUTRO", label: "Outro" },
  { value: "PREFIRO_NAO_INFORMAR", label: "Prefiro não informar" },
];
