import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { textoDeError } from '../formularios/errores-formulario';

/**
 * Texto del error de un control: `{{ formulario.controls.placa | errorCampo }}`. Es impuro
 * porque los errores de un control cambian sin que cambie la referencia del control.
 */
@Pipe({ name: 'errorCampo', standalone: true, pure: false })
export class ErrorCampoPipe implements PipeTransform {
  transform(control: AbstractControl | null | undefined): string | null {
    return control ? textoDeError(control.errors) : null;
  }
}
