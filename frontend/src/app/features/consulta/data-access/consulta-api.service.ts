import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { ArchivoDescargado, DescargaService } from '@core/http/descarga.service';
import { crearParametros } from '@core/http/parametros-http';
import {
  CalendarioMes,
  FiltroBusqueda,
  FiltroListado,
  InicioDia,
  ResultadoConsulta,
} from '@models/consulta.model';
import { DetalleIngreso } from '@models/detalle-ingreso.model';

/**
 * Lecturas de M07 (docs/contrato-api.md §6). Solo lectura: la única escritura del servidor es el
 * evento de la exportación. La búsqueda de la cabecera y los avisos viven en `core/consulta/`,
 * porque los usa el armazón.
 */
@Injectable({ providedIn: 'root' })
export class ConsultaApiService {
  private readonly http = inject(HttpClient);
  private readonly descarga = inject(DescargaService);
  private readonly base = `${inject(API_URL)}/consulta/`;

  /**
   * Búsqueda por placa y fecha (HU-M07-01). El servidor la distingue del listado por la
   * **presencia** de la clave `placa` o `fecha`, aunque vaya vacía (y entonces responde que
   * falta un criterio, CA06): por eso `placa` viaja siempre.
   */
  buscar(filtro: FiltroBusqueda, pagina = 1): Observable<ResultadoConsulta> {
    let params = new HttpParams().set('placa', filtro.placa.trim());
    if (filtro.fecha) {
      params = params.set('fecha', filtro.fecha);
    }
    if (filtro.hasta) {
      params = params.set('fecha_hasta', filtro.hasta);
    }
    return this.http.get<ResultadoConsulta>(`${this.base}ingresos/`, { params: params.set('page', pagina) });
  }

  /** Listado con filtros (HU-M07-02). Sin fechas, el servidor aplica el mes en curso (CA08). */
  listar(filtro: FiltroListado, pagina = 1): Observable<ResultadoConsulta> {
    return this.http.get<ResultadoConsulta>(`${this.base}ingresos/`, {
      params: crearParametros({ ...filtro, page: pagina }),
    });
  }

  /** CSV del conjunto completo filtrado; el nombre lo pone el servidor (CA13). Es de gestión. */
  exportar(filtro: FiltroListado): Observable<ArchivoDescargado> {
    return this.descarga.obtener(`${this.base}ingresos/exportar/`, crearParametros(filtro));
  }

  /** El detalle completo en una sola llamada: las pestañas no piden nada más (RNF-M07-02). */
  detalleIngreso(id: number): Observable<DetalleIngreso> {
    return this.http.get<DetalleIngreso>(`${this.base}ingresos/${id}/`);
  }

  /** La imagen exige sesión: no sirve en un `<img src>`, se pide como `Blob` (D-F14). */
  ticketIngreso(id: number): Observable<Blob> {
    return this.http.get(`${this.base}ingresos/${id}/ticket/`, { responseType: 'blob' });
  }

  calendario(anio: number, mes: number, dia?: number): Observable<CalendarioMes> {
    return this.http.get<CalendarioMes>(`${this.base}calendario/`, {
      params: crearParametros({ anio, mes, dia }),
    });
  }

  inicio(): Observable<InicioDia> {
    return this.http.get<InicioDia>(`${this.base}inicio/`);
  }
}
