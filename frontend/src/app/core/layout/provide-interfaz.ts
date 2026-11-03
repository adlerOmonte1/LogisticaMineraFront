import { Provider } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { DialogosService } from '../dialogos/dialogos.service';
import { PaginadorIntl } from '../i18n/paginador-intl';

const CAMPOS_DE_FORMULARIO: MatFormFieldDefaultOptions = {
  appearance: 'outline',
  subscriptSizing: 'dynamic',
};

/**
 * Configuración de Angular Material para las pantallas. Se declara en las rutas diferidas, no
 * en `app.config.ts`: importar estos tokens en el arranque arrastra form-field, select y
 * paginator al bundle inicial (~160 kB).
 *
 * `DialogosService` se vuelve a proveer aquí para que los diálogos se creen con este inyector
 * y sus campos también usen la apariencia `outline`.
 */
export function provideInterfaz(): Provider[] {
  return [
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: CAMPOS_DE_FORMULARIO },
    { provide: MatPaginatorIntl, useClass: PaginadorIntl },
    DialogosService,
  ];
}
