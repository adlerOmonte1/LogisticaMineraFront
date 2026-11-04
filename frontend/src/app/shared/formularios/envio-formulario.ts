import { signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, finalize } from 'rxjs';

import { comoErrorApi } from '@core/errores/error-inesperado';
import { ErrorApi } from '@models/error-api.model';
import { aplicarErrorEnFormulario } from './errores-formulario';

/**
 * Estado del envío de un formulario: si está enviando y el último error del servidor. Lo usan
 * todos los formularios y diálogos para no repetir el mismo manejo en cada uno.
 */
export class EnvioFormulario {
  readonly enviando = signal(false);
  readonly error = signal<ErrorApi | null>(null);

  ejecutar<T>(operacion: Observable<T>, alTerminar: (resultado: T) => void, formulario?: FormGroup): void {
    this.enviando.set(true);
    this.error.set(null);
    operacion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: alTerminar,
      error: (error: unknown) => {
        const errorApi = comoErrorApi(error);
        this.error.set(errorApi);
        if (formulario) {
          aplicarErrorEnFormulario(formulario, errorApi);
        }
      },
    });
  }

  limpiar(): void {
    this.error.set(null);
  }
}
