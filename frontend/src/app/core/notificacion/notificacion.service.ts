import { Injectable, Injector, inject } from '@angular/core';
import type { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { esErrorApi } from '@models/error-api.model';

const DURACION_MS = { exito: 4000, error: 7000 } as const;

/**
 * Avisos breves. Los mensajes de éxito del dominio llegan del servidor (`mensaje`) y se pasan
 * tal cual; los errores de un campo no van aquí, sino junto al campo.
 *
 * El snackbar de Material se carga en diferido: el interceptor de errores depende de este
 * servicio y, si lo importara directamente, el snackbar entraría en el bundle inicial.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly injector = inject(Injector);
  private snackBar: Promise<MatSnackBar> | null = null;

  exito(mensaje: string): void {
    void this.mostrar(mensaje, { duration: DURACION_MS.exito, panelClass: 'aviso-exito' });
  }

  error(mensaje: string): void {
    void this.mostrar(mensaje, {
      duration: DURACION_MS.error,
      panelClass: 'aviso-error',
      politeness: 'assertive',
    });
  }

  /**
   * Rechazo de una acción sobre una lista (desactivar, reactivar…): muestra el mensaje
   * literal de un 400, 404 o 409. El 403, la red y el 5xx ya los avisó el interceptor.
   */
  rechazo(error: unknown): void {
    if (esErrorApi(error) && !error.esDeRed && error.status !== 403 && error.status < 500) {
      this.error(error.mensaje);
    }
  }

  private async mostrar(mensaje: string, configuracion: MatSnackBarConfig): Promise<void> {
    const snackBar = await this.obtenerSnackBar();
    snackBar.open(mensaje, 'Cerrar', configuracion);
  }

  private obtenerSnackBar(): Promise<MatSnackBar> {
    this.snackBar ??= import('@angular/material/snack-bar').then(({ MatSnackBar }) =>
      this.injector.get(MatSnackBar),
    );
    return this.snackBar;
  }
}
