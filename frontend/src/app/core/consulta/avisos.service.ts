import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { Aviso } from '@models/consulta.model';
import { ConsultaCabeceraApiService } from './consulta-cabecera-api.service';

/**
 * Avisos de lo pendiente (campana de la cabecera). Se calculan en el servidor al consultarse y
 * ya vienen filtrados por el rol (HU-M07-04 CA08): el cliente no decide qué mostrar. Cada
 * `recargar()` cancela la anterior, así que una respuesta lenta no pisa a una reciente.
 */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly api = inject(ConsultaCabeceraApiService);
  private consulta: Subscription | null = null;

  readonly avisos = signal<readonly Aviso[]>([]);
  /** Texto del servidor cuando no hay nada pendiente. */
  readonly mensaje = signal<string | null>(null);
  readonly cargando = signal(false);
  /** `true` si la última lectura falló: los avisos mostrados pueden estar desactualizados. */
  readonly fallo = signal(false);

  recargar(): void {
    this.consulta?.unsubscribe();
    this.cargando.set(true);
    this.consulta = this.api.avisos().subscribe({
      next: (respuesta) => {
        this.avisos.set(respuesta.avisos);
        this.mensaje.set(respuesta.mensaje);
        this.fallo.set(false);
        this.cargando.set(false);
      },
      error: () => {
        this.fallo.set(true);
        this.cargando.set(false);
      },
    });
  }

  /** Al cerrar la sesión no debe quedar nada del usuario anterior. */
  limpiar(): void {
    this.consulta?.unsubscribe();
    this.avisos.set([]);
    this.mensaje.set(null);
    this.fallo.set(false);
    this.cargando.set(false);
  }
}
