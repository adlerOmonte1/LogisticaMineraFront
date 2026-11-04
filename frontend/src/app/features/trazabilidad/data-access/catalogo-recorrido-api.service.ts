import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, shareReplay, throwError } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { CatalogoRecorrido, EtapaCatalogo, RutasYDestinos } from '@models/lote.model';

/**
 * Etapas, rutas y destinos (docs/contrato-api.md §5.1): dominios cerrados que no cambian
 * mientras dura la sesión, así que se piden una vez y se reutilizan. Un fallo no queda en la
 * caché: el siguiente intento vuelve a pedirlos.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoRecorridoApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);
  private catalogo$: Observable<CatalogoRecorrido> | null = null;

  catalogo(): Observable<CatalogoRecorrido> {
    this.catalogo$ ??= forkJoin({
      etapas: this.http.get<EtapaCatalogo[]>(`${this.base}/etapas/`),
      rutas: this.http.get<RutasYDestinos>(`${this.base}/rutas/`),
    }).pipe(
      map(({ etapas, rutas }) => ({ etapas, ...rutas })),
      catchError((error: unknown) => {
        this.catalogo$ = null;
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    return this.catalogo$;
  }
}
