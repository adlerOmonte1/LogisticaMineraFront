import { Pipe, PipeTransform } from '@angular/core';

import { ETIQUETA_TITULARIDAD, Titularidad } from '@models/vehiculo.model';

/** «Propio» o «Externo»: el tipo de vehículo deriva de la titularidad del catálogo (C7). */
@Pipe({ name: 'etiquetaTitularidad', standalone: true })
export class EtiquetaTitularidadPipe implements PipeTransform {
  transform(titularidad: Titularidad | null | undefined): string {
    return titularidad ? ETIQUETA_TITULARIDAD[titularidad] : '—';
  }
}
