import { ChangeDetectionStrategy, Component, OnInit, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ErrorApi } from '@models/error-api.model';
import { NuevoTransportista, Transportista } from '@models/transportista.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { aplicarErrorEnFormulario } from '@shared/formularios/errores-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';

/**
 * Razón social y RUC (HU-M02-03). Los once dígitos del RUC los valida el servidor con su
 * mensaje literal (CA02); el campo abre el teclado numérico.
 */
@Component({
  selector: 'app-formulario-transportista',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="formulario" (ngSubmit)="guardar()" novalidate>
      <app-aviso-error [error]="error()" />
      <div class="formulario">
        <mat-form-field class="formulario__ancho">
          <mat-label>Razón social</mat-label>
          <input matInput formControlName="razon_social" autocomplete="organization" />
          <mat-error>{{ formulario.controls.razon_social | errorCampo }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>RUC</mat-label>
          <input matInput formControlName="ruc" inputmode="numeric" autocomplete="off" />
          <mat-error>{{ formulario.controls.ruc | errorCampo }}</mat-error>
        </mat-form-field>
      </div>
      <div class="acciones-formulario">
        <button mat-button type="button" (click)="cancelar.emit()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="enviando()">Guardar</button>
      </div>
    </form>
  `,
})
export class FormularioTransportistaComponent implements OnInit {
  readonly transportista = input<Transportista | null>(null);
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);
  readonly enviar = output<NuevoTransportista>();
  readonly cancelar = output<void>();

  protected readonly formulario = inject(FormBuilder).nonNullable.group({
    razon_social: ['', Validators.required],
    ruc: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const error = this.error();
      if (error) {
        aplicarErrorEnFormulario(this.formulario, error);
      }
    });
  }

  ngOnInit(): void {
    const transportista = this.transportista();
    if (transportista) {
      this.formulario.patchValue(transportista);
    }
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { razon_social, ruc } = this.formulario.getRawValue();
    this.enviar.emit({ razon_social: razon_social.trim(), ruc: ruc.trim() });
  }
}
