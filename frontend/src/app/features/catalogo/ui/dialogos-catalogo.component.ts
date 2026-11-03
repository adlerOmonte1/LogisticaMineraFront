import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { TipoMineral } from '@models/tipo-mineral.model';
import { NuevoTransportista, Transportista } from '@models/transportista.model';
import { NuevoVehiculo, Vehiculo } from '@models/vehiculo.model';
import {
  FormularioTipoMineralComponent,
  ValorTipoMineral,
} from '@shared/components/formulario-tipo-mineral/formulario-tipo-mineral.component';
import { FormularioVehiculoComponent } from '@shared/components/formulario-vehiculo/formulario-vehiculo.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { FormularioTransportistaComponent } from './formulario-transportista.component';

/*
 * Diálogos del catálogo. Cada uno solo une su formulario con `DialogoEnvioBase`: la página
 * decide qué se guarda, el diálogo presenta, muestra el error literal y se cierra.
 */

export interface DatosDialogoVehiculo extends DatosDialogoEnvio<NuevoVehiculo, Vehiculo> {
  vehiculo: Vehiculo | null;
  transportistas: readonly Transportista[];
}

@Component({
  selector: 'app-dialogo-vehiculo',
  standalone: true,
  imports: [MatDialogModule, FormularioVehiculoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>
    <mat-dialog-content>
      <app-formulario-vehiculo
        [vehiculo]="datos.vehiculo"
        [transportistas]="datos.transportistas"
        [error]="envio.error()"
        [enviando]="envio.enviando()"
        (enviar)="guardar($event)"
        (cancelar)="cerrar()"
      />
    </mat-dialog-content>
  `,
})
export class DialogoVehiculoComponent extends DialogoEnvioBase<
  NuevoVehiculo,
  Vehiculo,
  DatosDialogoVehiculo
> {}

export interface DatosDialogoTipoMineral extends DatosDialogoEnvio<ValorTipoMineral, TipoMineral> {
  tipoMineral: TipoMineral | null;
}

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

export interface DatosDialogoTransportista extends DatosDialogoEnvio<NuevoTransportista, Transportista> {
  transportista: Transportista | null;
}

@Component({
  selector: 'app-dialogo-transportista',
  standalone: true,
  imports: [MatDialogModule, FormularioTransportistaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>
    <mat-dialog-content>
      <app-formulario-transportista
        [transportista]="datos.transportista"
        [error]="envio.error()"
        [enviando]="envio.enviando()"
        (enviar)="guardar($event)"
        (cancelar)="cerrar()"
      />
    </mat-dialog-content>
  `,
})
export class DialogoTransportistaComponent extends DialogoEnvioBase<
  NuevoTransportista,
  Transportista,
  DatosDialogoTransportista
> {}
