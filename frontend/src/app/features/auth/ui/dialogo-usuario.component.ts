import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { UsuarioDetalle } from '@models/usuario.model';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import {
  FormularioUsuarioComponent,
  ValorFormularioUsuario,
} from './formulario-usuario/formulario-usuario.component';

export interface DatosDialogoUsuario extends DatosDialogoEnvio<ValorFormularioUsuario, UsuarioDetalle> {
  usuario: UsuarioDetalle | null;
}

@Component({
  selector: 'app-dialogo-usuario',
  standalone: true,
  imports: [MatDialogModule, FormularioUsuarioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>
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
