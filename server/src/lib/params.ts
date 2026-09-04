/** Normaliza um valor de req.params (o Express 5 tipa como string | string[]
 * para suportar segmentos repetidos) para uma única string. */
export function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}
