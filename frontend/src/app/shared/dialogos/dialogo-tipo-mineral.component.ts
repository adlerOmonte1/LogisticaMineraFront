import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { TipoMineral } from '@models/tipo-mineral.model';
import {
  FormularioTipoMineralComponent,
  ValorTipoMineral,
} from '../components/formulario-tipo-mineral/formulario-tipo-mineral.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from './dialogo-envio.base';

export interface DatosDialogoTipoMineral extends DatosDialogoEnvio<ValorTipoMineral, TipoMineral> {
  tipoMineral: TipoMineral | null;
  /** Alta desde el registro: el código es opcional (HU-M02-02 CA07). */
  desdeRegistro?: boolean;
  textoEnviar?: string;
}

/** Alta o edición de un tipo de mineral en un diálogo, desde el catálogo o desde el registro. */
@Component({
  selector: 'app-dialogo-tipo-mineral',
  standalone: true,
  imports: [MatDialogModule, FormularioTipoMineralComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>
    <mat-dialog-content>
      <app-formulario-tipo-mineral
        [tipoMineral]="datos.tipoMineral"
        [desdeRegistro]="datos.desdeRegistro ?? false"
        [textoEnviar]="datos.textoEnviar ?? 'Guardar'"
        [error]="envio.error()"
        [enviando]="envio.enviando()"
        (enviar)="guardar($event)"
        (cancelar)="cerrar()"
      />
    </mat-dialog-content>
  `,
})
export class DialogoTipoMineralComponent extends DialogoEnvioBase<
  ValorTipoMineral,
  TipoMineral,
  DatosDialogoTipoMineral
> {}
