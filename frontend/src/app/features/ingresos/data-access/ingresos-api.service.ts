import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import {
  CorreccionIngreso,
  Ingreso,
  MotivoSinFoto,
  NuevoDestare,
  PendientesDestare,
  ResultadoDestare,
  ReversionCorreccion,
} from '@models/ingreso.model';
import { ConMensaje } from '@models/pagina.model';
import { BorradorIngreso, ConfirmacionIngreso } from '@models/registro-ingreso.model';

const EXTENSION_POR_TIPO: Readonly<Record<string, string>> = { 'image/png': 'png', 'image/jpeg': 'jpg' };

/**
 * Operaciones de M03 sobre un ingreso (docs/contrato-api.md §4). Es el único lugar de la
 * feature que habla con `HttpClient`.
 */
@Injectable({ providedIn: 'root' })
export class IngresosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/ingresos/`;

  /** Recibe la imagen y devuelve la propuesta con el borrador firmado. No persiste nada (D-13). */
  iniciarBorrador(imagen: Blob): Observable<BorradorIngreso> {
    const formulario = new FormData();
    formulario.append('imagen', imagen, nombreDeArchivo(imagen));
    return this.http.post<BorradorIngreso>(`${this.base}borradores/`, formulario);
  }

  iniciarBorradorSinFoto(motivo: MotivoSinFoto): Observable<BorradorIngreso> {
    const formulario = new FormData();
    formulario.append('sin_foto', 'true');
    formulario.append('motivo_sin_respaldo', motivo);
    return this.http.post<BorradorIngreso>(`${this.base}borradores/`, formulario);
  }

  registrar(confirmacion: ConfirmacionIngreso): Observable<ConMensaje<Ingreso>> {
    return this.http.post<ConMensaje<Ingreso>>(this.base, confirmacion);
  }

  obtener(id: number): Observable<Ingreso> {
    return this.http.get<Ingreso>(`${this.base}${id}/`);
  }

  corregir(id: number, correccion: CorreccionIngreso): Observable<ConMensaje<Ingreso>> {
    return this.http.patch<ConMensaje<Ingreso>>(`${this.base}${id}/`, correccion);
  }

  revertirCorreccion(id: number, reversion: ReversionCorreccion): Observable<ConMensaje<Ingreso>> {
    return this.http.post<ConMensaje<Ingreso>>(`${this.base}${id}/revertir-correccion/`, reversion);
  }

  anular(id: number, motivo: string): Observable<ConMensaje<Ingreso>> {
    return this.http.patch<ConMensaje<Ingreso>>(`${this.base}${id}/anular/`, { motivo });
  }

  pendientesDestare(): Observable<PendientesDestare> {
    return this.http.get<PendientesDestare>(this.base);
  }

  registrarDestare(destare: NuevoDestare): Observable<ResultadoDestare> {
    return this.http.post<ResultadoDestare>(`${this.base}destares/`, destare);
  }
}

/** El servidor distingue JPG de PNG por el contenido; el nombre solo debe ser razonable. */
export function nombreDeArchivo(imagen: Blob): string {
  if (imagen instanceof File) {
    return imagen.name;
  }
  return `ticket.${EXTENSION_POR_TIPO[imagen.type] ?? 'jpg'}`;
}
