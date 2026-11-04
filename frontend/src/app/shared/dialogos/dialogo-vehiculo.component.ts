import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { Transportista } from '@models/transportista.model';
import { NuevoVehiculo, Vehiculo } from '@models/vehiculo.model';
import { FormularioVehiculoComponent } from '../components/formulario-vehiculo/formulario-vehiculo.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from './dialogo-envio.base';

export interface DatosDialogoVehiculo extends DatosDialogoEnvio<NuevoVehiculo, Vehiculo> {
  vehiculo: Vehiculo | null;
  transportistas: readonly Transportista[];
  /** Placa leída del ticket, para el alta desde el registro (HU-M02-01 CA12). */
  placaSugerida?: string | null;
  textoEnviar?: string;
}

/**
 * Alta o edición de un vehículo en un diálogo. Lo usan el catálogo y el registro de un
 * ingreso, que no pierde lo capturado porque no sale de su pantalla (RNF-M03-13).
 */
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
        [placaSugerida]="datos.placaSugerida ?? null"
        [textoEnviar]="datos.textoEnviar ?? 'Guardar'"
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
