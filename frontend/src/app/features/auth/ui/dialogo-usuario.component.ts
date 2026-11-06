import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { UsuarioDetalle } from '@models/usuario.model';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import {
  FormularioUsuarioComponent,
  ValorFormularioUsuario,
} from './formulario-usuario/formulario-usuario.component';
import { CabeceraDialogoComponent } from '@shared/components/cabecera-dialogo/cabecera-dialogo.component';

export interface DatosDialogoUsuario extends DatosDialogoEnvio<ValorFormularioUsuario, UsuarioDetalle> {
  usuario: UsuarioDetalle | null;
}

@Component({
  selector: 'app-dialogo-usuario',
  standalone: true,
  imports: [CabeceraDialogoComponent, MatDialogModule, FormularioUsuarioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera-dialogo>{{ titulo }}</app-cabecera-dialogo>
    <mat-dialog-content>
      <app-formulario-usuario
        [usuario]="datos.usuario"
        [error]="envio.error()"
        [enviando]="envio.enviando()"
        (enviar)="guardar($event)"
        (cancelar)="cerrar()"
      />
    </mat-dialog-content>
  `,
})
export class DialogoUsuarioComponent extends DialogoEnvioBase<
  ValorFormularioUsuario,
  UsuarioDetalle,
  DatosDialogoUsuario
> {}
