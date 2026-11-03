import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ErrorApi } from '@models/error-api.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { aplicarErrorEnFormulario } from '../../formularios/errores-formulario';
import { ErrorCampoPipe } from '../../pipes/error-campo.pipe';
import { AvisoErrorComponent } from '../aviso-error/aviso-error.component';

export interface ValorTipoMineral {
  codigo: string;
  nombre: string;
}

/**
 * Código y nombre de un tipo de mineral (HU-M02-02). En el alta desde el registro el código
 * es opcional (CA07); en la edición no cambia (RN-M02-16). Las reglas del código y del nombre
 * las responde el servidor con sus mensajes literales (CA05, CA06, CA08).
 */
@Component({
  selector: 'app-formulario-tipo-mineral',
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
        <mat-form-field>
          <mat-label>Código</mat-label>
          <input
            matInput
            formControlName="codigo"
            autocapitalize="characters"
            autocomplete="off"
            [readonly]="esEdicion()"
            (input)="normalizarCodigo()"
            data-prueba="codigo"
          />
          @if (desdeRegistro()) {
            <mat-hint>Opcional: si lo deja vacío, el sistema lo genera</mat-hint>
          } @else if (esEdicion()) {
            <mat-hint>El código no cambia después del alta</mat-hint>
          }
          <mat-error>{{ formulario.controls.codigo | errorCampo }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" autocomplete="off" data-prueba="nombre" />
          <mat-error>{{ formulario.controls.nombre | errorCampo }}</mat-error>
        </mat-form-field>
      </div>
      <div class="acciones-formulario">
        <button mat-button type="button" (click)="cancelar.emit()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="enviando()">
          {{ textoEnviar() }}
        </button>
      </div>
    </form>
  `,
})
export class FormularioTipoMineralComponent implements OnInit {
  readonly tipoMineral = input<TipoMineral | null>(null);
  readonly desdeRegistro = input(false);
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);
  readonly textoEnviar = input('Guardar');

  readonly enviar = output<ValorTipoMineral>();
  readonly cancelar = output<void>();

  protected readonly esEdicion = computed(() => this.tipoMineral() !== null);
  protected readonly formulario = inject(FormBuilder).nonNullable.group({ codigo: [''], nombre: [''] });

  constructor() {
    effect(() => {
      const error = this.error();
      if (error) {
        aplicarErrorEnFormulario(this.formulario, error);
      }
    });
  }

  ngOnInit(): void {
    const tipoMineral = this.tipoMineral();
    if (tipoMineral) {
      this.formulario.patchValue(tipoMineral);
    }
  }

  protected normalizarCodigo(): void {
    const control = this.formulario.controls.codigo;
    control.setValue(control.value.toUpperCase().trim(), { emitEvent: false });
  }

  protected guardar(): void {
    const { codigo, nombre } = this.formulario.getRawValue();
    this.enviar.emit({ codigo: codigo.trim(), nombre: nombre.trim() });
  }
}
