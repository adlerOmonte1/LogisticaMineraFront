import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { DetalleIngreso } from '@models/detalle-ingreso.model';

/**
 * Lecturas de M07 (docs/contrato-api.md §6). En FB3 solo el detalle del ingreso y su ticket; el
 * listado, la búsqueda, el calendario y el inicio llegan en FB6.
 */
@Injectable({ providedIn: 'root' })
export class ConsultaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/consulta/`;

  /** El detalle completo en una sola llamada: las pestañas no piden nada más (RNF-M07-02). */
  detalleIngreso(id: number): Observable<DetalleIngreso> {
    return this.http.get<DetalleIngreso>(`${this.base}ingresos/${id}/`);
  }

  /** La imagen exige sesión: no sirve en un `<img src>`, se pide como `Blob` (D-F14). */
  ticketIngreso(id: number): Observable<Blob> {
    return this.http.get(`${this.base}ingresos/${id}/ticket/`, { responseType: 'blob' });
  }
}
