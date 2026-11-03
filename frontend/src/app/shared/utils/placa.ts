/**
 * Normaliza lo que se escribe en una placa: mayúsculas y sin espacios. No valida el formato:
 * el patrón es configurable en el servidor (D-24) y la regla V3 responde con su mensaje.
 */
export function normalizarPlaca(valor: string): string {
  return valor.toUpperCase().replace(/\s+/g, '');
}
