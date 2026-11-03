import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DECIMAL_DOS_CIFRAS = /^\d+(\.\d{1,2})?$/;

/**
 * Número positivo con hasta dos decimales, escrito con punto. Es ayuda de experiencia: el
 * servidor vuelve a validar (D-08).
 */
export function decimalPositivo(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = normalizarDecimal(String(control.value ?? ''));
    if (valor === '') {
      return null;
    }
    return DECIMAL_DOS_CIFRAS.test(valor) && Number(valor) > 0 ? null : { decimal: true };
  };
}

/** Normaliza la coma decimal que escribe el teclado de un teléfono en español. */
export function normalizarDecimal(valor: string): string {
  return valor.trim().replace(',', '.');
}
