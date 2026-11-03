import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { UsuarioResumen } from '@models/usuario.model';
import {
  AccionExtra,
  AccionesRegistroComponent,
} from '@shared/components/acciones-registro/acciones-registro.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { EtiquetaRolPipe } from '@shared/pipes/etiqueta-rol.pipe';

const RESTABLECER_CLAVE = 'restablecer-clave';

/**
 * Usuarios con sus acciones (HU-M01-02). Presentacional. Desactivar la propia cuenta se ofrece
 * igual: lo rechaza el servidor con su mensaje literal (CA09).
 */
@Component({
  selector: 'app-tabla-usuarios',
  standalone: true,
  imports: [MatTableModule, InsigniaEstadoComponent, AccionesRegistroComponent, EtiquetaRolPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-usuarios.component.html',
})
export class TablaUsuariosComponent {
  readonly usuarios = input.required<UsuarioResumen[]>();

  readonly editar = output<UsuarioResumen>();
  readonly desactivar = output<UsuarioResumen>();
  readonly reactivar = output<UsuarioResumen>();
  readonly restablecerClave = output<UsuarioResumen>();

  protected readonly columnas = ['nombre', 'username', 'rol', 'estado', 'acciones'];
  protected readonly extras: readonly AccionExtra[] = [
    { id: RESTABLECER_CLAVE, etiqueta: 'Restablecer contraseña', icono: 'key', soloActivo: true },
  ];

  protected alElegirExtra(accion: string, usuario: UsuarioResumen): void {
    if (accion === RESTABLECER_CLAVE) {
      this.restablecerClave.emit(usuario);
    }
  }
}
