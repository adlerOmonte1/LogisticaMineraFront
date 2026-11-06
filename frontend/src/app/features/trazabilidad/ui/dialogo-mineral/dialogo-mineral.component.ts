import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { RespuestaLote } from '@models/lote.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { CabeceraDialogoComponent } from '@shared/components/cabecera-dialogo/cabecera-dialogo.component';

export interface DatosDialogoMineral extends DatosDialogoEnvio<number | null, RespuestaLote> {
  minerales: readonly TipoMineral[];
}

/**
 * Agregar otro mineral a la lista del lote (HU-M06-01 CA17). Se ofrecen todos los vigentes: uno
 * que ya está en el lote lo rechaza el servidor con su mensaje (CA18).
 */
@Component({
  selector: 'app-dialogo-mineral',
  standalone: true,
  imports: [
    CabeceraDialogoComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    AvisoErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera-dialogo>{{ titulo }}</app-cabecera-dialogo>
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-dialog-content>
        <app-aviso-error [error]="envio.error()" />
        <mat-form-field class="campo">
          <mat-label>Tipo de mineral</mat-label>
          <mat-select formControlName="tipo" data-prueba="mineral">
            @for (mineral of datos.minerales; track mineral.id) {
              <mat-option [value]="mineral.id">{{ mineral.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
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
          Agregar
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
export class DialogoMineralComponent extends DialogoEnvioBase<
  number | null,
  RespuestaLote,
  DatosDialogoMineral
> {
  protected readonly formulario = new FormGroup({ tipo: new FormControl<number | null>(null) });

  protected enviar(): void {
    this.guardar(this.formulario.controls.tipo.value);
  }
}
