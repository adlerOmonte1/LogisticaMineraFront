import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

/** Si el navegador cree tener red. Alimenta la franja de conexión del armazón. */
@Injectable({ providedIn: 'root' })
export class ConectividadService {
  private readonly ventana = inject(DOCUMENT).defaultView;
  private readonly estado = signal(this.ventana?.navigator.onLine ?? true);

  readonly enLinea = this.estado.asReadonly();

  constructor() {
    this.ventana?.addEventListener('online', () => this.estado.set(true));
    this.ventana?.addEventListener('offline', () => this.estado.set(false));
  }
}
