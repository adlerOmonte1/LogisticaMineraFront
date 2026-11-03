import { Pipe, PipeTransform } from '@angular/core';

const FORMATO = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Toneladas para mostrar. Los decimales llegan como cadena (`"32.40"`) y así se guardan en
 * los modelos (D-F17); solo se convierten aquí, al presentar.
 */
@Pipe({ name: 'toneladas', standalone: true })
export class ToneladasPipe implements PipeTransform {
  transform(valor: string | number | null | undefined, conUnidad = true): string {
    if (valor === null || valor === undefined || valor === '') {
      return '—';
    }
    const numero = Number(valor);
    if (Number.isNaN(numero)) {
      return '—';
    }
    return conUnidad ? `${FORMATO.format(numero)} t` : FORMATO.format(numero);
  }
}
