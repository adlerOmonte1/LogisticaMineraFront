/** Con cuánta anticipación se renueva el `access` antes de que venza. */
export const MARGEN_RENOVACION_MS = 5 * 60 * 1000;

export interface EstadoRenovacion {
  ahora: number;
  vencimientoAccess: number | null;
  ultimaActividad: number;
  margenMs?: number;
}

/**
 * Decide si hay que renovar el `access` (D-F20). El backend usa la vida del `access` como
 * ventana de inactividad (HU-M01-01 CA06), así que el cliente solo lo renueva cuando:
 *
 * - está por vencer, y
 * - el usuario trabajó dentro de ese margen.
 *
 * Un token ya vencido **no** se renueva: la petición sale con él y el servidor responde
 * «Su sesión ha expirado», con su mensaje literal.
 */
export function debeRenovar({
  ahora,
  vencimientoAccess,
  ultimaActividad,
  margenMs = MARGEN_RENOVACION_MS,
}: EstadoRenovacion): boolean {
  if (vencimientoAccess === null || ahora >= vencimientoAccess) {
    return false;
  }
  const porVencer = vencimientoAccess - ahora <= margenMs;
  const usuarioActivo = ahora - ultimaActividad <= margenMs;
  return porVencer && usuarioActivo;
}
