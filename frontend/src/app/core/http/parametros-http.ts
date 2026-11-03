import { HttpParams } from '@angular/common/http';

export type ValorParametro = string | number | boolean | null | undefined;

/**
 * Convierte un objeto de filtros en `HttpParams`, omitiendo lo vacío. Los booleanos viajan
 * como `1`/`0`, que es lo que entienden los filtros del backend (`incluir_inactivos=1`).
 */
export function crearParametros(filtros: object = {}): HttpParams {
  let parametros = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros) as [string, ValorParametro][]) {
    if (valor === null || valor === undefined || valor === '') {
      continue;
    }
    parametros = parametros.set(clave, aTexto(valor));
  }
  return parametros;
}

function aTexto(valor: string | number | boolean): string {
  if (typeof valor === 'boolean') {
    return valor ? '1' : '0';
  }
  return String(valor);
}
