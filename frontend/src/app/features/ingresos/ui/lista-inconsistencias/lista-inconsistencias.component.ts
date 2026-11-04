import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { startWith, switchMap } from 'rxjs';

import { Inconsistencia, JustificacionFaltante } from '@models/error-api.model';

export type JustificacionesForm = FormRecord<FormControl<string>>;

/**
 * Inconsistencias de las reglas V1 a V5, con el mensaje literal del servidor (HU-M05-01 CA01,
 * CA05). Una que exige justificación lleva su caja de texto; una bloqueante pide corregir el
 * dato. Presentacional: los controles de justificación los crea quien aloja el formulario.
 */
@Component({
  selector: 'app-lista-inconsistencias',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (inconsistencias().length > 0) {
      <ul class="inconsistencias" role="list">
        @for (inconsistencia of inconsistencias(); track inconsistencia.regla) {
          <li
            class="inconsistencia"
            [class.inconsistencia--bloqueante]="inconsistencia.bloqueante"
            [attr.data-regla]="inconsistencia.regla"
          >
            <mat-icon aria-hidden="true">{{ inconsistencia.bloqueante ? 'error' : 'warning' }}</mat-icon>
            <div class="inconsistencia__cuerpo">
              <p class="inconsistencia__mensaje">
                <strong>{{ inconsistencia.regla }}</strong> · {{ inconsistencia.mensaje }}
              </p>
              @if (porRevalidar().includes(inconsistencia.regla)) {
                <p class="inconsistencia__nota">Cambió un dato: se revalidará al confirmar.</p>
              } @else if (inconsistencia.bloqueante) {
                <p class="inconsistencia__nota">Corrija el dato para poder registrar.</p>
              }
              @if (inconsistencia.exige_justificacion) {
                @if (controlDe(inconsistencia.regla); as control) {
                  <mat-form-field class="inconsistencia__justificacion">
                    <mat-label>Justificación de {{ inconsistencia.regla }}</mat-label>
                    <textarea
                      matInput
                      rows="2"
                      [formControl]="control"
                      [attr.data-prueba]="'justificacion-' + inconsistencia.regla"
                    ></textarea>
                    @if (faltante(inconsistencia.regla); as faltante) {
                      <mat-error>{{ faltante.mensaje }}</mat-error>
                    }
                  </mat-form-field>
                }
              }
            </div>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './lista-inconsistencias.component.scss',
})
export class ListaInconsistenciasComponent {
  readonly inconsistencias = input.required<readonly Inconsistencia[]>();
  readonly justificaciones = input.required<JustificacionesForm>();
  /** Reglas cuyo dato cambió desde que se evaluaron: se mostrarán «por revalidar». */
  readonly porRevalidar = input<readonly string[]>([]);
  /** Justificaciones que el servidor reclamó al rechazar la confirmación. */
  readonly faltantes = input<readonly JustificacionFaltante[]>([]);

  /**
   * Quien aloja el formulario crea las cajas de justificación cuando llegan las inconsistencias.
   * Agregar un control no cambia la referencia del registro, así que se escucha su `valueChanges`:
   * sin esto, este componente `OnPush` no dibujaría la caja hasta otra pasada de detección.
   */
  private readonly cambiosDelRegistro = toSignal(
    toObservable(this.justificaciones).pipe(
      switchMap((registro) => registro.valueChanges.pipe(startWith(registro.getRawValue()))),
    ),
  );

  protected controlDe(regla: string): FormControl<string> | undefined {
    this.cambiosDelRegistro();
    return this.justificaciones().controls[regla];
  }

  protected faltante(regla: string): JustificacionFaltante | undefined {
    const control = this.justificaciones().controls[regla];
    return this.faltantes().find((f) => f.regla === regla && !control?.value.trim());
  }
}
