/**
 * Solo lo que cambió entre el recurso original y el valor del formulario. Las ediciones son
 * `PATCH` parciales y el backend responde «No hay cambios que guardar» si no hay ninguno.
 */
export function cambiosRespectoDe<T extends object>(original: Partial<T>, valor: T): Partial<T> {
  const cambios: Partial<T> = {};
  for (const clave of Object.keys(valor) as (keyof T)[]) {
    if (normalizar(valor[clave]) !== normalizar(original[clave])) {
      cambios[clave] = valor[clave];
    }
  }
  return cambios;
}

function normalizar(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}
