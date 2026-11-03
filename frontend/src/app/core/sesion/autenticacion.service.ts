import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';

import { Credenciales, UsuarioSesion } from '@models/usuario.model';
import { SesionApiService } from './sesion-api.service';
import { SesionService } from './sesion.service';

export const RUTA_INICIO_SESION = '/login';
export const RUTA_CAMBIO_CLAVE = '/cuenta/clave';
export const RUTA_PRINCIPAL = '/inicio';

/**
 * Fachada del ciclo de vida de la sesión: iniciar, cerrar y expirar. Une la API y el estado,
 * y guarda el motivo del último cierre para que la pantalla de inicio de sesión lo muestre.
 */
@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly api = inject(SesionApiService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly motivo = signal<string | null>(null);

  /** Mensaje literal del servidor que explica por qué terminó la sesión anterior. */
  readonly motivoCierre = this.motivo.asReadonly();

  iniciarSesion(credenciales: Credenciales): Observable<UsuarioSesion> {
    return this.api.iniciar(credenciales).pipe(
      tap((respuesta) => {
        this.motivo.set(null);
        this.sesion.iniciar(respuesta);
      }),
      map(({ usuario }) => usuario),
    );
  }

  /** Ruta a la que va el usuario recién autenticado (HU-M01-01 CA01 y CA09). */
  rutaDeEntrada(usuario: UsuarioSesion): string {
    return usuario.debe_cambiar_clave ? RUTA_CAMBIO_CLAVE : RUTA_PRINCIPAL;
  }

  /** Cierre pedido por el usuario (HU-M01-01 CA05). Si la API falla, se cierra igual. */
  cerrarSesion(motivo: string | null = null): Observable<void> {
    const refresh = this.sesion.refresh;
    const invalidar = refresh
      ? this.api.cerrar(refresh).pipe(catchError(() => of(undefined)))
      : of(undefined);
    return invalidar.pipe(finalize(() => this.terminar(motivo)));
  }

  /** El servidor dio la sesión por terminada (401): no hay token que invalidar. */
  expirarSesion(motivo: string): void {
    this.terminar(motivo);
  }

  descartarMotivo(): void {
    this.motivo.set(null);
  }

  private terminar(motivo: string | null): void {
    this.sesion.finalizar();
    this.motivo.set(motivo);
    void this.router.navigateByUrl(RUTA_INICIO_SESION);
  }
}
