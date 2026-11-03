/**
 * Lectura del vencimiento de un JWT, sin verificar la firma: eso lo hace el servidor. El
 * cliente solo necesita saber cuándo vence el `access` para renovarlo a tiempo.
 */
export function leerVencimientoMs(token: string): number | null {
  const carga = token.split('.')[1];
  if (!carga) {
    return null;
  }
  try {
    const datos: unknown = JSON.parse(decodificarBase64Url(carga));
    const exp = (datos as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function decodificarBase64Url(texto: string): string {
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(relleno);
}
