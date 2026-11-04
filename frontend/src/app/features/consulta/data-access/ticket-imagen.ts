import { DestroyRef, signal } from '@angular/core';

import { ConsultaApiService } from './consulta-api.service';

/**
 * La imagen del ticket de un ingreso como URL de objeto. Exige sesión, así que se pide como
 * `Blob` autenticado (D-F14) y no en un `<img src>`; la URL se libera al cambiar de ingreso y al
 * destruir la pantalla. Pedir dos veces el mismo ingreso no repite la descarga.
 */
export class TicketImagen {
  readonly url = signal<string | null>(null);
  /** `true` si la imagen no se pudo traer: el resto de los datos sigue disponible (RNF-M07-09). */
  readonly fallo = signal(false);

  private urlObjeto: string | null = null;
  private solicitadoDe: number | null = null;

  constructor(
    private readonly api: ConsultaApiService,
    destroyRef: DestroyRef,
  ) {
    destroyRef.onDestroy(() => this.liberar());
  }

  cargar(id: number): void {
    if (this.solicitadoDe === id) {
      return;
    }
    this.liberar();
    this.solicitadoDe = id;
    this.api.ticketIngreso(id).subscribe({
      next: (imagen) => {
        this.urlObjeto = URL.createObjectURL(imagen);
        this.url.set(this.urlObjeto);
      },
      error: () => this.fallo.set(true),
    });
  }

  liberar(): void {
    if (this.urlObjeto) {
      URL.revokeObjectURL(this.urlObjeto);
      this.urlObjeto = null;
    }
    this.url.set(null);
    this.fallo.set(false);
    this.solicitadoDe = null;
  }
}
