import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { SoloMensaje } from '@models/pagina.model';
import { CambioClave } from '@models/usuario.model';

/** Operaciones del usuario sobre su propia cuenta (HU-M01-02 CA05 a CA07, CA11). */
@Injectable({ providedIn: 'root' })
export class CuentaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/usuarios`;

  cambiarClave(cambio: CambioClave): Observable<SoloMensaje> {
    return this.http.post<SoloMensaje>(`${this.base}/cambiar-clave/`, cambio);
  }
}
