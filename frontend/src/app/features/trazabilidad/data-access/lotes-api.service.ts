import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { crearParametros } from '@core/http/parametros-http';
import {
  CuerpoAsignar,
  CuerpoBigbags,
  CuerpoCierre,
  CuerpoEtapa,
  CuerpoSecadoPropio,
  DisponiblesLote,
  FiltroLotes,
  LoteFila,
  NuevoLote,
  ParteNueva,
  RespuestaBigbags,
  RespuestaEtapa,
  RespuestaLote,
  ResumenLote,
} from '@models/lote.model';
import { Pagina } from '@models/pagina.model';

/**
 * Lotes de proceso y su recorrido (M06; docs/contrato-api.md §5.2). Un método por operación del
 * contrato, sin lógica: lo que corresponde registrar lo dice `siguientes`, no este servicio.
 * Ninguna operación elimina (D-22): un mineral se quita, un ingreso se retira.
 */
@Injectable({ providedIn: 'root' })
export class LotesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/lotes/`;

  listar(filtro: FiltroLotes, pagina = 1): Observable<Pagina<LoteFila>> {
    return this.http.get<Pagina<LoteFila>>(this.base, {
      params: crearParametros({ ...filtro, page: pagina }),
    });
  }

  /** Detalle completo del lote, sin cuerpo extra: es la misma forma que devuelven las acciones. */
  obtener(id: number): Observable<RespuestaLote> {
    return this.http.get<RespuestaLote>(`${this.base}${id}/`);
  }

  abrir(lote: NuevoLote): Observable<RespuestaLote> {
    return this.http.post<RespuestaLote>(this.base, lote);
  }

  /**
   * Sin tipo elegido no se envía el campo: un `null` explícito lo rechaza el serializador como
   * «Datos inválidos», y el mensaje que corresponde es el del servidor por el campo ausente.
   */
  agregarMineral(id: number, tipoMineral: number | null): Observable<RespuestaLote> {
    const cuerpo = tipoMineral === null ? {} : { tipo_mineral: tipoMineral };
    return this.http.post<RespuestaLote>(`${this.base}${id}/minerales/`, cuerpo);
  }

  quitarMineral(id: number, tipoMineral: number): Observable<RespuestaLote> {
    return this.http.post<RespuestaLote>(`${this.base}${id}/minerales/${tipoMineral}/quitar/`, {});
  }

  /** Ingresos que se pueden asignar: los del mineral del lote y, aparte, los de otros minerales. */
  disponibles(id: number): Observable<DisponiblesLote> {
    return this.http.get<DisponiblesLote>(`${this.base}${id}/ingresos/`);
  }

  asignar(id: number, cuerpo: CuerpoAsignar): Observable<RespuestaLote> {
    return this.http.post<RespuestaLote>(`${this.base}${id}/ingresos/`, cuerpo);
  }

  retirar(id: number, idIngreso: number): Observable<RespuestaLote> {
    return this.http.post<RespuestaLote>(`${this.base}${id}/ingresos/${idIngreso}/retirar/`, {});
  }

  iniciarRecorrido(id: number): Observable<RespuestaLote> {
    return this.http.patch<RespuestaLote>(`${this.base}${id}/iniciar-recorrido/`, {});
  }

  registrarEtapa(id: number, cuerpo: CuerpoEtapa): Observable<RespuestaEtapa> {
    return this.http.post<RespuestaEtapa>(`${this.base}${id}/etapas/`, cuerpo);
  }

  /** Secado propio de un ingreso tardío, con su reparto por partes si el lote está dividido. */
  secadoPropio(id: number, idIngreso: number, cuerpo: CuerpoSecadoPropio): Observable<RespuestaLote> {
    return this.http.post<RespuestaLote>(`${this.base}${id}/ingresos/${idIngreso}/secado/`, cuerpo);
  }

  bigbags(id: number, cuerpo: CuerpoBigbags): Observable<RespuestaBigbags> {
    return this.http.post<RespuestaBigbags>(`${this.base}${id}/bigbags/`, cuerpo);
  }

  dividir(id: number, partes: readonly ParteNueva[]): Observable<RespuestaLote> {
    return this.http.post<RespuestaLote>(`${this.base}${id}/division/`, { partes });
  }

  resumen(id: number): Observable<ResumenLote> {
    return this.http.get<ResumenLote>(`${this.base}${id}/resumen/`);
  }

  /** Sin destino no se envía el campo (HU-M06-05 CA03 responde el servidor con su mensaje). */
  cerrar(id: number, cuerpo: CuerpoCierre): Observable<RespuestaLote> {
    const { destino, ...resto } = cuerpo;
    return this.http.patch<RespuestaLote>(
      `${this.base}${id}/cerrar/`,
      destino ? { destino, ...resto } : resto,
    );
  }
}
