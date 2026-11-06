import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CambioTara, Vehiculo } from '@models/vehiculo.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { aplicarErrorEnFormulario } from '@shared/formularios/errores-formulario';
import { decimalPositivo, normalizarDecimal } from '@shared/formularios/validadores';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { CabeceraDialogoComponent } from '@shared/components/cabecera-dialogo/cabecera-dialogo.component';

export interface DatosDialogoTara extends DatosDialogoEnvio<CambioTara, Vehiculo> {
  vehiculo: Vehiculo;
}

/**
 * Cambio de la tara de un vehículo, solo del Administrador (HU-M02-01 CA09 a CA11). El motivo
 * no se exige en el cliente: el servidor lo reclama con su mensaje literal (CA10). Los ingresos
 * ya registrados conservan la tara que se les aplicó.
 */
@Component({
  selector: 'app-dialogo-tara',
  standalone: true,
  imports: [
    CabeceraDialogoComponent,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera-dialogo>{{ titulo }}</app-cabecera-dialogo>
    <form [formGroup]="formulario" (ngSubmit)="enviarFormulario()" novalidate>
      <mat-dialog-content>
        <app-aviso-error [error]="envio.error()" />
        <p class="texto-secundario">
          Tara actual: {{ datos.vehiculo.tara_tn | toneladas }}. Los ingresos ya registrados conservan la tara
          que se les aplicó.
        </p>
        <div class="formulario">
          <mat-form-field>
            <mat-label>Nueva tara (t)</mat-label>
            <input matInput formControlName="tara_tn" inputmode="decimal" autocomplete="off" />
            <mat-error>{{ formulario.controls.tara_tn | errorCampo }}</mat-error>
          </mat-form-field>
          <mat-form-field class="formulario__ancho">
            <mat-label>Motivo del cambio</mat-label>
            <textarea matInput formControlName="motivo" rows="3"></textarea>
            <mat-error>{{ formulario.controls.motivo | errorCampo }}</mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cerrar()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="envio.enviando()">
          Guardar tara
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class DialogoTaraComponent extends DialogoEnvioBase<CambioTara, Vehiculo, DatosDialogoTara> {
  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    tara_tn: ['', [Validators.required, decimalPositivo()]],
    motivo: [''],
  });

  constructor() {
    super();
    effect(() => {
      const error = this.envio.error();
      if (error) {
        aplicarErrorEnFormulario(this.formulario, error);
      }
    });
  }

  enviarFormulario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { tara_tn, motivo } = this.formulario.getRawValue();
    this.guardar({ tara_tn: normalizarDecimal(tara_tn), motivo: motivo.trim() });
  }
}
