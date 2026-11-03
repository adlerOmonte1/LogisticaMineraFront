import { Injectable, computed, inject, signal } from '@angular/core';

import { Rol } from '@models/rol.model';
import { RespuestaLogin, UsuarioSesion } from '@models/usuario.model';
import { AlmacenSesionService, SesionGuardada } from './almacen-sesion.service';
import { leerVencimientoMs } from './token-jwt';

/**
 * Estado de la sesión: quién es el usuario y con qué tokens habla con la API. No hace
 * peticiones ni navega (responsabilidad única): eso es de `AutenticacionService`.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly almacen = inject(AlmacenSesionService);
  private readonly estado = signal<SesionGuardada | null>(this.almacen.leer());

  readonly usuario = computed<UsuarioSesion | null>(() => this.estado()?.usuario ?? null);
  readonly autenticado = computed(() => this.estado() !== null);
  readonly rol = computed<Rol | null>(() => this.usuario()?.rol ?? null);
  readonly debeCambiarClave = computed(() => this.usuario()?.debe_cambiar_clave ?? false);

  get access(): string | null {
    return this.estado()?.access ?? null;
  }

  get refresh(): string | null {
    return this.estado()?.refresh ?? null;
  }

  /** Vencimiento del `access` en milisegundos; `null` sin sesión o con un token ilegible. */
  get vencimientoAccess(): number | null {
    return this.access ? leerVencimientoMs(this.access) : null;
  }

  iniciar({ access, refresh, usuario }: RespuestaLogin): void {
    this.establecer({ access, refresh, usuario });
  }

  actualizarAccess(access: string): void {
    const actual = this.estado();
    if (actual) {
      this.establecer({ ...actual, access });
    }
  }

  /** El servidor exige cambiar la contraseña temporal (HU-M01-01 CA09). */
  marcarClaveTemporalPendiente(): void {
    this.cambiarUsuario({ debe_cambiar_clave: true });
  }

  finalizar(): void {
    this.estado.set(null);
    this.almacen.borrar();
  }

  private cambiarUsuario(cambios: Partial<UsuarioSesion>): void {
    const actual = this.estado();
    if (actual) {
      this.establecer({ ...actual, usuario: { ...actual.usuario, ...cambios } });
    }
  }

  private establecer(sesion: SesionGuardada): void {
    this.estado.set(sesion);
    this.almacen.guardar(sesion);
  }
}
