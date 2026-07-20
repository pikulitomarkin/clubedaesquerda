// `[a, b].sort()` devolve `string[]`, que sob `noUncheckedIndexedAccess`
// tipa cada elemento como `string | undefined` — mesmo sabendo que há
// exatamente 2. Esse helper preserva a tupla `[string, string]` para os
// vários lugares que ordenam um par de ids canonicamente (ver
// docs/contexto.md §3.2).
export function sortPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}
