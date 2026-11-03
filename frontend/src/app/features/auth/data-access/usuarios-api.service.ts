import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { crearParametros } from '@core/http/parametros-http';
import { ConMensaje, Pagina } from '@models/pagina.model';
import {
  CambiosUsuario,
  ClaveTemporal,
  FiltroUsuarios,
  NuevoUsuario,
  UsuarioDetalle,
  UsuarioResumen,
} from '@models/usuario.model';

/** Gestión de usuarios, solo del Administrador (HU-M01-02; docs/contrato-api.md §2.2). */
@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/usuarios/`;

  listar(filtro: FiltroUsuarios, pagina = 1): Observable<Pagina<UsuarioResumen>> {
    return this.http.get<Pagina<UsuarioResumen>>(this.base, {
      params: crearParametros({ ...filtro, page: pagina }),
    });
  }

  obtener(id: number): Observable<UsuarioDetalle> {
    return this.http.get<UsuarioDetalle>(`${this.base}${id}/`);
  }

  crear(usuario: NuevoUsuario): Observable<UsuarioDetalle> {
    return this.http.post<UsuarioDetalle>(this.base, usuario);
  }

  editar(id: number, cambios: CambiosUsuario): Observable<UsuarioDetalle> {
    return this.http.patch<UsuarioDetalle>(`${this.base}${id}/`, cambios);
  }

  desactivar(id: number): Observable<ConMensaje<UsuarioDetalle>> {
    return this.http.patch<ConMensaje<UsuarioDetalle>>(`${this.base}${id}/desactivar/`, {});
  }

  reactivar(id: number): Observable<ConMensaje<UsuarioDetalle>> {
    return this.http.patch<ConMensaje<UsuarioDetalle>>(`${this.base}${id}/reactivar/`, {});
  }

  /** La clave temporal viaja solo en esta respuesta (HU-M01-02 CA08). */
  restablecerClave(id: number): Observable<ClaveTemporal> {
    return this.http.post<ClaveTemporal>(`${this.base}${id}/restablecer-clave/`, {});
  }
}
