import { Pipe, PipeTransform } from '@angular/core';

export type FormatoFecha = 'fecha' | 'fechaHora' | 'hora';

const ZONA = 'America/Lima';

const FORMATOS: Readonly<Record<FormatoFecha, Intl.DateTimeFormat>> = {
  fecha: new Intl.DateTimeFormat('es-PE', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }),
  fechaHora: new Intl.DateTimeFormat('es-PE', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
  hora: new Intl.DateTimeFormat('es-PE', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
};

/**
 * Fechas en la zona de la planta, sin depender de la del teléfono (D-F17). Una fecha sola
 * (`AAAA-MM-DD`) se interpreta como día calendario, sin desplazarla por la zona horaria.
 */
@Pipe({ name: 'fechaLima', standalone: true })
export class FechaLimaPipe implements PipeTransform {
  transform(valor: string | null | undefined, formato: FormatoFecha = 'fechaHora'): string {
    if (!valor) {
      return '—';
    }
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
    const fecha = new Date(soloFecha ? `${valor}T12:00:00-05:00` : valor);
    return Number.isNaN(fecha.getTime()) ? '—' : FORMATOS[formato].format(fecha).replace(',', '');
  }
}
