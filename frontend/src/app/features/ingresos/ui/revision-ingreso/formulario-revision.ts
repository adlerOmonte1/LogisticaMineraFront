import { FormControl, FormGroup, FormRecord } from '@angular/forms';

import { CamposRegistro } from '@models/registro-ingreso.model';
import { decimalPositivo } from '@shared/formularios/validadores';

export type FormularioRevision = FormGroup<{
  placa: FormControl<string>;
  fecha: FormControl<string>;
  hora: FormControl<string>;
  peso_bruto_tn: FormControl<string>;
  tipo_mineral: FormControl<number | null>;
  justificaciones: FormRecord<FormControl<string>>;
}>;

/**
 * El formulario de la revisión. Sin validadores de «obligatorio»: el servidor reclama los
 * campos ausentes con su mensaje literal (HU-M03-01 CA03, D-F23). Solo se cuida el formato
 * decimal del peso, que no tiene criterio con mensaje propio.
 */
export function crearFormularioRevision(): FormularioRevision {
  return new FormGroup({
    placa: new FormControl('', { nonNullable: true }),
    fecha: new FormControl('', { nonNullable: true }),
    hora: new FormControl('', { nonNullable: true }),
    peso_bruto_tn: new FormControl('', { nonNullable: true, validators: [decimalPositivo()] }),
    tipo_mineral: new FormControl<number | null>(null),
    justificaciones: new FormRecord<FormControl<string>>({}),
  });
}

/** Crea la caja de justificación de cada regla que la exige y todavía no tiene control. */
export function asegurarJustificaciones(
  registro: FormRecord<FormControl<string>>,
  reglas: readonly string[],
): void {
  for (const regla of reglas) {
    if (!registro.contains(regla)) {
      registro.addControl(regla, new FormControl('', { nonNullable: true }));
    }
  }
}

export function camposDe(formulario: FormularioRevision): CamposRegistro {
  const { placa, fecha, hora, peso_bruto_tn, tipo_mineral } = formulario.getRawValue();
  return { placa, fecha, hora, peso_bruto_tn, tipo_mineral };
}

export function justificacionesDe(formulario: FormularioRevision): Record<string, string> {
  return formulario.controls.justificaciones.getRawValue();
}
