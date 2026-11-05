import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RespuestaAvisos, ResultadoCabecera } from '@models/consulta.model';
import { API_URL } from '../http/api-url.token';

/**
 * Lo de M07 que vive en la cabecera de toda pantalla: la búsqueda rápida y los avisos
 * (docs/contrato-api.md §6). Está en `core/` porque el armazón no puede depender de un feature
 * (D-F22), igual que los datos de referencia (D-F26).
 */
@Injectable({ providedIn: 'root' })
export class ConsultaCabeceraApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/consulta/`;

  /** Código completo o dígitos finales → el ingreso; cualquier otro texto → una placa. */
  buscar(texto: string): Observable<ResultadoCabecera> {
    return this.http.get<ResultadoCabecera>(`${this.base}cabecera/`, {
      params: new HttpParams().set('q', texto),
    });
  }

  avisos(): Observable<RespuestaAvisos> {
    return this.http.get<RespuestaAvisos>(`${this.base}avisos/`);
  }
}
