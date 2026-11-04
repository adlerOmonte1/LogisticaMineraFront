import { ChangeDetectionStrategy, Component, effect, inject, input, output, untracked } from '@angular/core';
import { FormBuilder, FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ErrorApi } from '@models/error-api.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { aplicarErrorEnFormulario } from '@shared/formularios/errores-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { ListaInconsistenciasComponent } from '../lista-inconsistencias/lista-inconsistencias.component';
import { asegurarJustificaciones } from '../revision-ingreso/formulario-revision';

export interface DatosMotivo {
  motivo: string;
  justificaciones: Record<string, string>;
}

/**
 * Un motivo y nada más: lo piden la anulación y la reversión de una corrección. El motivo vacío
 * lo rechaza el servidor con su mensaje (HU-M03-03 CA02, HU-M03-02 CA02); si una reversión
 * restaura valores que incumplen una regla, aquí aparece con su caja de justificación (CA14).
 */
@Component({
  selector: 'app-formulario-motivo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
    ListaInconsistenciasComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="tarjeta" [formGroup]="formulario" (ngSubmit)="enviarMotivo()" novalidate>
      <app-aviso-error [error]="error()" />
      <mat-form-field>
        <mat-label>{{ etiqueta() }}</mat-label>
        <textarea matInput rows="3" formControlName="motivo" data-prueba="motivo"></textarea>
        <mat-error>{{ formulario.controls.motivo | errorCampo }}</mat-error>
      </mat-form-field>
      <app-lista-inconsistencias
        [inconsistencias]="error()?.inconsistencias ?? []"
        [justificaciones]="formulario.controls.justificaciones"
        [faltantes]="error()?.justificacionesFaltantes ?? []"
      />
      <div class="acciones-formulario">
        <button mat-button type="button" [disabled]="enviando()" (click)="cancelar.emit()">Cancelar</button>
        <button
          mat-flat-button
          [color]="advertencia() ? 'warn' : 'primary'"
          type="submit"
          [disabled]="enviando()"
          data-prueba="enviar-motivo"
        >
          {{ textoEnviar() }}
        </button>
      </div>
    </form>
  `,
})
export class FormularioMotivoComponent {
  readonly etiqueta = input.required<string>();
  readonly textoEnviar = input.required<string>();
  readonly advertencia = input(false);
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);

  readonly enviar = output<DatosMotivo>();
  readonly cancelar = output<void>();

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    motivo: [''],
    justificaciones: new FormRecord<FormControl<string>>({}),
  });

  constructor() {
    effect(() => {
      const error = this.error();
      if (!error) {
        return;
      }
      untracked(() => {
        aplicarErrorEnFormulario(this.formulario, error);
        asegurarJustificaciones(
          this.formulario.controls.justificaciones,
          error.inconsistencias.filter((i) => i.exige_justificacion).map((i) => i.regla),
        );
      });
    });
  }

  protected enviarMotivo(): void {
    const { motivo, justificaciones } = this.formulario.getRawValue();
    this.enviar.emit({
      motivo: motivo.trim(),
      justificaciones: Object.fromEntries(
        Object.entries(justificaciones).filter(([, texto]) => texto.trim() !== ''),
      ),
    });
  }
}
