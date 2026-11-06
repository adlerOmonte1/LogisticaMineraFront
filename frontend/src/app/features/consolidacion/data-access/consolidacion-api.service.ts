import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { ArchivoDescargado, DescargaService } from '@core/http/descarga.service';
import { crearParametros } from '@core/http/parametros-http';
import { Consolidado, Periodo } from '@models/consolidacion.model';

/**
 * Consolidación de la producción (M08; docs/contrato-api.md §7), de gestión. La pantalla y el
 * archivo salen del mismo cálculo del servidor (RN-M08-05): el cliente no suma nada.
 */
@Injectable({ providedIn: 'root' })
export class ConsolidacionApiService {
  private readonly http = inject(HttpClient);
  private readonly descarga = inject(DescargaService);
  private readonly base = `${inject(API_URL)}/consolidacion/mensual/`;

  mensual({ anio, mes }: Periodo): Observable<Consolidado> {
    return this.http.get<Consolidado>(this.base, { params: crearParametros({ anio, mes }) });
  }

  /** XLSX con el nombre que pone el servidor; un mes vacío vuelve como error dentro del Blob. */
  exportar({ anio, mes }: Periodo): Observable<ArchivoDescargado> {
    return this.descarga.obtener(`${this.base}exportar/`, crearParametros({ anio, mes }));
  }
}
