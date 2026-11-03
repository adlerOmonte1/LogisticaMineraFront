import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Credenciales, RespuestaLogin, RespuestaRenovacion } from '@models/usuario.model';
import { API_URL } from '../http/api-url.token';
import { contextoSinSesion } from '../http/contexto-http';

/**
 * Endpoints de sesión de M01 (docs/contrato-api.md §2.1). Es el `data-access` del núcleo.
 *
 * La renovación usa `HttpBackend` directamente: si pasara por los interceptores, el de
 * autenticación intentaría renovar la propia renovación.
 */
@Injectable({ providedIn: 'root' })
export class SesionApiService {
  private readonly http = inject(HttpClient);
  private readonly httpSinInterceptores = new HttpClient(inject(HttpBackend));
  private readonly base = `${inject(API_URL)}/auth`;

  iniciar(credenciales: Credenciales): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.base}/login/`, credenciales, {
      context: contextoSinSesion(),
    });
  }

  cerrar(refresh: string): Observable<void> {
    return this.http
      .post<null>(`${this.base}/logout/`, { refresh }, { context: contextoSinSesion() })
      .pipe(map(() => undefined));
  }

  renovar(refresh: string): Observable<string> {
    return this.httpSinInterceptores
      .post<RespuestaRenovacion>(`${this.base}/refresh/`, { refresh })
      .pipe(map(({ access }) => access));
  }
}
