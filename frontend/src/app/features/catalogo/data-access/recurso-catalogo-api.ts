import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { recorrerPaginas } from '@core/http/paginacion';
import { crearParametros } from '@core/http/parametros-http';
import { ConMensaje, Pagina } from '@models/pagina.model';

/** Filtro común de los tres catálogos: por defecto el backend lista solo los vigentes. */
export interface FiltroCatalogo {
  incluir_inactivos?: boolean;
}

/** Lo mínimo que tiene todo registro de catálogo. */
export interface RegistroCatalogo {
  id: number;
  activo: boolean;
}

/** Baja lógica y reactivación (D-07, D-22). Lo único que necesita la página base. */
export interface EstadoCatalogoApi<T> {
  desactivar(id: number): Observable<ConMensaje<T>>;
  reactivar(id: number): Observable<ConMensaje<T>>;
}

/**
 * API de un catálogo de M02. Las tres entidades comparten forma en el backend
 * (`CatalogoViewSet`): listar, crear, ver, editar, desactivar y reactivar; aquí se escribe una
 * vez y cada servicio solo añade lo propio (abierto a extensión, cerrado a modificación).
 *
 * `listarVigentes()` guarda en memoria la lista completa para los selectores (D-F16) y se
 * invalida con cada escritura propia.
 */
export abstract class RecursoCatalogoApi<
  TRecurso extends RegistroCatalogo,
  TAlta,
  TCambios,
  TFiltro extends object = object,
> implements EstadoCatalogoApi<TRecurso>
{
  protected readonly http = inject(HttpClient);
  protected readonly base: string;
  private vigentes$: Observable<TRecurso[]> | null = null;

  protected constructor(recurso: string) {
    this.base = `${inject(API_URL)}/catalogo/${recurso}/`;
  }

  listar(filtro: TFiltro & FiltroCatalogo, pagina = 1): Observable<Pagina<TRecurso>> {
    return this.http.get<Pagina<TRecurso>>(this.base, {
      params: crearParametros({ ...filtro, page: pagina }),
    });
  }

  listarVigentes(): Observable<TRecurso[]> {
    this.vigentes$ ??= recorrerPaginas<TRecurso>(this.http, this.base).pipe(
      catchError((error: unknown) => {
        this.invalidarCache();
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    return this.vigentes$;
  }

  obtener(id: number): Observable<TRecurso> {
    return this.http.get<TRecurso>(this.url(id));
  }

  crear(alta: TAlta): Observable<TRecurso> {
    return this.http.post<TRecurso>(this.base, alta).pipe(tap(() => this.invalidarCache()));
  }

  editar(id: number, cambios: TCambios): Observable<TRecurso> {
    return this.http.patch<TRecurso>(this.url(id), cambios).pipe(tap(() => this.invalidarCache()));
  }

  desactivar(id: number): Observable<ConMensaje<TRecurso>> {
    return this.http
      .patch<ConMensaje<TRecurso>>(this.url(id, 'desactivar'), {})
      .pipe(tap(() => this.invalidarCache()));
  }

  reactivar(id: number): Observable<ConMensaje<TRecurso>> {
    return this.http
      .patch<ConMensaje<TRecurso>>(this.url(id, 'reactivar'), {})
      .pipe(tap(() => this.invalidarCache()));
  }

  invalidarCache(): void {
    this.vigentes$ = null;
  }

  protected url(id: number, accion?: string): string {
    return accion ? `${this.base}${id}/${accion}/` : `${this.base}${id}/`;
  }
}
