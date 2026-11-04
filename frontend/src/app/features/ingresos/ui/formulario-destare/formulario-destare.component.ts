import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ErrorApi } from '@models/error-api.model';
import { VehiculoPendiente } from '@models/ingreso.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { aplicarErrorEnFormulario } from '@shared/formularios/errores-formulario';
import { decimalPositivo, normalizarDecimal } from '@shared/formularios/validadores';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { aIsoLima } from '@shared/utils/fecha-hora';

export interface DatosDestare {
  tara_tn: string;
  fecha_destare: string | null;
  /** Por código de ingreso (D-25). */
  justificaciones: Record<string, string>;
}

/**
 * La tara del vehículo y, solo si el servidor la reclama, la justificación de cada ingreso cuyo
 * peso neto quede fuera de rango (HU-M03-04 CA01 a CA04, CA09). Las reglas las responde el
 * servidor con su mensaje literal: aquí no se adelanta ninguna (D-F23).
 */
@Component({
  selector: 'app-formulario-destare',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="tarjeta" [formGroup]="formulario" (ngSubmit)="registrar()" novalidate>
      <h2 class="titulo">
        Destare del vehículo <span class="monoespaciado">{{ vehiculo().placa }}</span>
      </h2>
      <p class="texto-secundario">
        La tara se fija una sola vez y se aplica a sus {{ vehiculo().ingresos }}
        {{ vehiculo().ingresos === 1 ? 'ingreso' : 'ingresos' }} en proceso.
      </p>
      <app-aviso-error [error]="error()" />

      <div class="formulario">
        <mat-form-field>
          <mat-label>Tara (t)</mat-label>
          <input
            matInput
            formControlName="tara_tn"
            inputmode="decimal"
            autocomplete="off"
            data-prueba="tara"
          />
          <mat-error>{{ formulario.controls.tara_tn | errorCampo }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Fecha y hora del destare</mat-label>
          <input matInput type="datetime-local" formControlName="fecha_destare" data-prueba="fecha-destare" />
          <mat-hint>Si la deja vacía se usa el momento actual</mat-hint>
          <mat-error>{{ formulario.controls.fecha_destare | errorCampo }}</mat-error>
        </mat-form-field>
      </div>

      @for (faltante of error()?.justificacionesFaltantes ?? []; track faltante.ingreso) {
        @if (faltante.ingreso; as ingreso) {
          <mat-form-field class="justificacion">
            <mat-label>Justificación de {{ ingreso }}</mat-label>
            <textarea
              matInput
              rows="2"
              [value]="justificaciones()[ingreso] || ''"
              (input)="escribirJustificacion(ingreso, $event)"
              [attr.data-prueba]="'justificacion-' + ingreso"
            ></textarea>
            <mat-hint>{{ faltante.mensaje }}</mat-hint>
          </mat-form-field>
        }
      }

      <div class="acciones-formulario">
        <button mat-button type="button" [disabled]="enviando()" (click)="cancelar.emit()">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          [disabled]="enviando()"
          data-prueba="registrar-destare"
        >
          Registrar destare
        </button>
      </div>
    </form>
  `,
  styles: `
    .titulo {
      margin: 0;
    }
    .justificacion {
      width: 100%;
    }
  `,
})
export class FormularioDestareComponent {
  readonly vehiculo = input.required<VehiculoPendiente>();
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);

  readonly registrarDestare = output<DatosDestare>();
  readonly cancelar = output<void>();

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    tara_tn: ['', decimalPositivo()],
    fecha_destare: [''],
  });

  /** Justificación por código de ingreso (D-25). Solo se piden las que el servidor reclama. */
  protected readonly justificaciones = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      const error = this.error();
      if (!error) {
        return;
      }
      untracked(() => {
        aplicarErrorEnFormulario(this.formulario, error);
      });
    });
  }

  protected escribirJustificacion(ingreso: string, evento: Event): void {
    const texto = (evento.target as HTMLTextAreaElement).value;
    this.justificaciones.update((actuales) => ({ ...actuales, [ingreso]: texto }));
  }

  protected registrar(): void {
    if (this.formulario.controls.tara_tn.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { tara_tn, fecha_destare } = this.formulario.getRawValue();
    this.registrarDestare.emit({
      tara_tn: normalizarDecimal(tara_tn),
      fecha_destare: aIsoLima(fecha_destare),
      justificaciones: Object.fromEntries(
        Object.entries(this.justificaciones()).filter(([, texto]) => texto.trim() !== ''),
      ),
    });
  }
}
