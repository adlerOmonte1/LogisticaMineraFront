import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

import { RELOJ } from './reloj';

const EVENTOS_DE_ACTIVIDAD = ['pointerdown', 'keydown', 'touchstart'] as const;

/**
 * Último momento en que el usuario tocó la pantalla o el teclado. Decide si la sesión se
 * renueva: el `access` es la ventana de inactividad del backend (D-F20).
 */
@Injectable({ providedIn: 'root' })
export class ActividadUsuarioService {
  private readonly reloj = inject(RELOJ);
  private ultima = this.reloj();

  constructor() {
    const documento = inject(DOCUMENT);
    for (const evento of EVENTOS_DE_ACTIVIDAD) {
      documento.addEventListener(evento, () => this.registrar(), { passive: true, capture: true });
    }
  }

  get ultimaActividad(): number {
    return this.ultima;
  }

  registrar(): void {
    this.ultima = this.reloj();
  }
}
