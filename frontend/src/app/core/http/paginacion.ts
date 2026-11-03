import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

import { Pagina } from '@models/pagina.model';

/**
 * Trae todas las páginas de un listado y devuelve sus filas juntas.
 *
 * No sigue la URL absoluta de `next`: el backend la arma con su propio host y, detrás del
 * proxy de desarrollo, apunta a otro origen al que el interceptor no adjunta el token. Pide
 * `?page=n+1` sobre la misma ruta mientras `next` no sea nulo.
 */
export function recorrerPaginas<T>(
  http: HttpClient,
  url: string,
  parametros: HttpParams = new HttpParams(),
): Observable<T[]> {
  const pedir = (numero: number): Observable<{ numero: number; pagina: Pagina<T> }> =>
    http
      .get<Pagina<T>>(url, { params: parametros.set('page', numero) })
      .pipe(map((pagina) => ({ numero, pagina })));

  return pedir(1).pipe(
    expand(({ numero, pagina }) => (pagina.next ? pedir(numero + 1) : EMPTY)),
    reduce((filas: T[], { pagina }) => filas.concat(pagina.results), []),
  );
}
