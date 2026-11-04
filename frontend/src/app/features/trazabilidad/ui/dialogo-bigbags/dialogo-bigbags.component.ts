import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CuerpoBigbags, ParteLote, RespuestaBigbags } from '@models/lote.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { normalizarDecimal } from '@shared/formularios/validadores';

export interface DatosDialogoBigbags extends DatosDialogoEnvio<CuerpoBigbags, RespuestaBigbags> {
  partes: readonly ParteLote[];
}

/**
 * Asociar bigbags al ensacado (HU-M06-02 CA11 a CA13). El peso que resulta por bigbag es
 * aproximado y el servidor lo calcula; «Recalcular» solo se marca cuando ya se había asociado
 * todo el ensacado y se quiere corregir (el servidor lo exige con su mensaje, CA12).
 */
@Component({
  selector: 'app-dialogo-bigbags',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AvisoErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-dialog-content>
        <app-aviso-error [error]="envio.error()" />
        @if (datos.partes.length > 0) {
          <mat-form-field class="campo">
            <mat-label>Parte</mat-label>
            <mat-select formControlName="parte" data-prueba="parte">
              @for (parte of datos.partes; track parte.id) {
                <mat-option [value]="parte.id">{{ parte.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        <mat-form-field class="campo">
          <mat-label>Cantidad de bigbags</mat-label>
          <input
            matInput
            formControlName="cantidad"
            inputmode="numeric"
            autocomplete="off"
            data-prueba="cantidad"
          />
        </mat-form-field>
        <mat-form-field class="campo">
          <mat-label>Peso aproximado por bigbag (t), opcional</mat-label>
          <input matInput formControlName="peso" inputmode="decimal" autocomplete="off" data-prueba="peso" />
        </mat-form-field>
        <mat-checkbox formControlName="recalcular" data-prueba="recalcular">
          Recalcular el peso aproximado
        </mat-checkbox>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cerrar()">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          [disabled]="envio.enviando()"
          data-prueba="enviar"
        >
          Asociar
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .campo {
      width: 100%;
    }
  `,
})
export class DialogoBigbagsComponent extends DialogoEnvioBase<
  CuerpoBigbags,
  RespuestaBigbags,
  DatosDialogoBigbags
> {
  protected readonly formulario = new FormGroup({
    parte: new FormControl<number | null>(null),
    cantidad: new FormControl('', { nonNullable: true }),
    peso: new FormControl('', { nonNullable: true }),
    recalcular: new FormControl(false, { nonNullable: true }),
  });

  protected enviar(): void {
    const { parte, cantidad, peso, recalcular } = this.formulario.getRawValue();
    const numero = Number.parseInt(cantidad.trim(), 10);
    this.guardar({
      parte,
      cantidad: Number.isNaN(numero) ? null : numero,
      recalcular,
      peso_aproximado_tn: peso.trim() ? normalizarDecimal(peso.trim()) : null,
    });
  }
}
