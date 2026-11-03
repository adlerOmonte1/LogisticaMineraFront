import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

import { ErrorApi } from '@models/error-api.model';

/** Clave con la que se guarda en un control el error que mandó el servidor. */
export const ERROR_SERVIDOR = 'servidor';

/** Texto de la interfaz para un campo que el servidor reclama sin mensaje propio. */
const TEXTO_OBLIGATORIO = 'Campo obligatorio';

/**
 * Pinta en el formulario los errores de campo de un `ErrorApi`. Los nombres de los controles
 * son los de la API (`tipo_titularidad`, `capacidad_tn`…), así que la asignación es directa.
 * El `mensaje` general no va aquí: lo muestra `app-aviso-error` sobre el formulario.
 */
export function aplicarErrorEnFormulario(formulario: FormGroup, error: ErrorApi): void {
  for (const campo of error.camposObligatorios) {
    marcar(formulario.get(campo), TEXTO_OBLIGATORIO);
  }
  for (const [campo, texto] of Object.entries(error.camposConError)) {
    marcar(formulario.get(campo), texto);
  }
}

function marcar(control: AbstractControl | null, texto: string): void {
  if (!control) {
    return;
  }
  control.setErrors({ ...(control.errors ?? {}), [ERROR_SERVIDOR]: texto });
  control.markAsTouched();
}

/** Texto a mostrar bajo un control, o `null` si no hay error visible. */
export function textoDeError(errores: ValidationErrors | null): string | null {
  if (!errores) {
    return null;
  }
  if (typeof errores[ERROR_SERVIDOR] === 'string') {
    return errores[ERROR_SERVIDOR];
  }
  if (errores['required']) {
    return TEXTO_OBLIGATORIO;
  }
  if (errores['minlength']) {
    return `Debe tener al menos ${errores['minlength'].requiredLength} caracteres`;
  }
  if (errores['maxlength']) {
    return `Debe tener como máximo ${errores['maxlength'].requiredLength} caracteres`;
  }
  if (errores['min']) {
    return `Debe ser mayor o igual que ${errores['min'].min}`;
  }
  if (errores['pattern']) {
    return 'El formato no es válido';
  }
  if (errores['decimal']) {
    return 'Ingrese un número con hasta dos decimales';
  }
  return 'Valor no válido';
}
