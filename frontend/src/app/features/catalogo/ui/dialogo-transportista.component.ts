import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { NuevoTransportista, Transportista } from '@models/transportista.model';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { FormularioTransportistaComponent } from './formulario-transportista.component';
import { CabeceraDialogoComponent } from '@shared/components/cabecera-dialogo/cabecera-dialogo.component';

export interface DatosDialogoTransportista extends DatosDialogoEnvio<NuevoTransportista, Transportista> {
  transportista: Transportista | null;
}

@Component({
  selector: 'app-dialogo-transportista',
  standalone: true,
  imports: [CabeceraDialogoComponent, MatDialogModule, FormularioTransportistaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera-dialogo>{{ titulo }}</app-cabecera-dialogo>
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
