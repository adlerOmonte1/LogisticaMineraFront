import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EMPTY, Observable, filter, switchMap } from 'rxjs';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { ETIQUETA_ROL, ROLES, Rol } from '@models/rol.model';
import { ClaveTemporal, FiltroUsuarios, UsuarioDetalle, UsuarioResumen } from '@models/usuario.model';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { cambiosRespectoDe } from '@shared/utils/cambios';
import { UsuariosApiService } from '../../data-access/usuarios-api.service';
import { DialogoClaveTemporalComponent } from '../../ui/dialogo-clave-temporal.component';
import { DatosDialogoUsuario, DialogoUsuarioComponent } from '../../ui/dialogo-usuario.component';
import { ValorFormularioUsuario } from '../../ui/formulario-usuario/formulario-usuario.component';
import { TablaUsuariosComponent } from '../../ui/tabla-usuarios/tabla-usuarios.component';

/** Gestión de usuarios del Administrador (HU-M01-02, HU-M01-03). */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MarcoListadoComponent,
    TablaUsuariosComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios.page.html',
})
export class UsuariosPage implements OnInit {
  private readonly api = inject(UsuariosApiService);
  private readonly dialogos = inject(DialogosService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly roles = ROLES;
  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly listado = crearListadoPaginado<UsuarioResumen, FiltroUsuarios>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    { rol: null, incluir_inactivos: false },
  );

  ngOnInit(): void {
    this.listado.cargar();
  }

  filtrarPorRol(rol: Rol | null): void {
    this.listado.filtrar({ rol });
  }

  mostrarInactivos(incluir: boolean): void {
    this.listado.filtrar({ incluir_inactivos: incluir });
  }

  crear(): void {
    this.abrirFormulario({
      titulo: 'Nuevo usuario',
      usuario: null,
      guardar: ({ password, ...datos }) => this.api.crear({ ...datos, password: password ?? '' }),
    });
  }

  editar({ id }: UsuarioResumen): void {
    this.api.obtener(id).subscribe((usuario) =>
      this.abrirFormulario({
        titulo: `Editar a ${usuario.username}`,
        usuario,
        guardar: (valor) => this.api.editar(id, cambiosRespectoDe<ValorFormularioUsuario>(usuario, valor)),
      }),
    );
  }

  desactivar(usuario: UsuarioResumen): void {
    this.confirmarYEjecutar(
      `¿Desactivar a ${usuario.username}?`,
      'No podrá iniciar sesión. Sus registros y su historial se conservan.',
      'Desactivar',
      () => this.api.desactivar(usuario.id),
    );
  }

  reactivar(usuario: UsuarioResumen): void {
    this.confirmarYEjecutar(
      `¿Reactivar a ${usuario.username}?`,
      'Recupera el acceso con su mismo rol.',
      'Reactivar',
      () => this.api.reactivar(usuario.id),
    );
  }

  restablecerClave(usuario: UsuarioResumen): void {
    this.dialogos
      .confirmar({
        titulo: `¿Restablecer la contraseña de ${usuario.username}?`,
        mensaje: 'Se genera una contraseña temporal que deberá cambiar al iniciar sesión.',
        textoConfirmar: 'Restablecer',
        advertencia: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.restablecerClave(usuario.id)),
        switchMap((clave) =>
          this.dialogos.abrir<DialogoClaveTemporalComponent, ClaveTemporal, void>(
            DialogoClaveTemporalComponent,
            clave,
          ),
        ),
      )
      .subscribe({ error: (error: unknown) => this.notificacion.rechazo(error) });
  }

  private abrirFormulario(datos: DatosDialogoUsuario): void {
    this.dialogos
      .abrir<DialogoUsuarioComponent, DatosDialogoUsuario, UsuarioDetalle>(DialogoUsuarioComponent, datos)
      .pipe(filter(Boolean))
      .subscribe(() => this.listado.cargar());
  }

  private confirmarYEjecutar(
    titulo: string,
    mensaje: string,
    textoConfirmar: string,
    accion: () => Observable<{ mensaje?: string | null }>,
  ): void {
    this.dialogos
      .confirmar({ titulo, mensaje, textoConfirmar, advertencia: true })
      .pipe(switchMap((confirmado) => (confirmado ? accion() : EMPTY)))
      .subscribe({
        next: (respuesta) => {
          if (respuesta.mensaje) {
            this.notificacion.exito(respuesta.mensaje);
          }
          this.listado.cargar();
        },
        error: (error: unknown) => this.notificacion.rechazo(error),
      });
  }
}
