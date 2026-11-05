import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { AutorizacionService } from '../../autorizacion/autorizacion.service';
import { ConectividadService } from '../../conectividad/conectividad.service';
import { AutenticacionService, RUTA_CAMBIO_CLAVE } from '../../sesion/autenticacion.service';
import { SesionService } from '../../sesion/sesion.service';
import { BarraInferiorComponent } from '../barra-inferior/barra-inferior.component';
import { BusquedaCabeceraComponent } from '../busqueda-cabecera/busqueda-cabecera.component';
import { CampanaAvisosComponent } from '../campana-avisos/campana-avisos.component';
import { FranjaConexionComponent } from '../franja-conexion/franja-conexion.component';
import { MenuLateralComponent } from '../menu-lateral/menu-lateral.component';
import { MenuUsuarioComponent } from '../menu-usuario/menu-usuario.component';
import {
  ACCION_PRINCIPAL,
  NAVEGACION,
  agruparPorSeccion,
  filtrarPorPermiso,
  itemsDeBarraInferior,
} from '../navegacion';

/** Ancho desde el que la barra lateral queda fija (tableta horizontal y escritorio). */
const CONSULTA_ESCRITORIO = '(min-width: 1024px)';

/**
 * Armazón de toda pantalla con sesión. Construye el menú con el rol de la sesión
 * (HU-M01-03 CA01) y lo oculta mientras la contraseña temporal esté pendiente (CA09).
 */
@Component({
  selector: 'app-armazon',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MenuLateralComponent,
    MenuUsuarioComponent,
    BarraInferiorComponent,
    BusquedaCabeceraComponent,
    CampanaAvisosComponent,
    FranjaConexionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './armazon.component.html',
  styleUrl: './armazon.component.scss',
})
export class ArmazonComponent {
  private readonly sesion = inject(SesionService);
  private readonly autorizacion = inject(AutorizacionService);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);

  protected readonly usuario = this.sesion.usuario;
  protected readonly debeCambiarClave = this.sesion.debeCambiarClave;
  protected readonly enLinea = inject(ConectividadService).enLinea;
  protected readonly esEscritorio = toSignal(
    inject(BreakpointObserver)
      .observe(CONSULTA_ESCRITORIO)
      .pipe(map((estado) => estado.matches)),
    { initialValue: true },
  );

  private readonly itemsPermitidos = computed(() =>
    filtrarPorPermiso(NAVEGACION, (permiso) => this.autorizacion.puede(permiso)),
  );
  protected readonly grupos = computed(() => agruparPorSeccion(this.itemsPermitidos()));
  protected readonly itemsBarraInferior = computed(() => itemsDeBarraInferior(this.itemsPermitidos()));
  protected readonly accionPrincipal = computed(() =>
    this.autorizacion.puede(ACCION_PRINCIPAL.permiso) ? ACCION_PRINCIPAL : null,
  );
  protected readonly mostrarNavegacion = computed(() => !this.debeCambiarClave());

  private readonly lateral = viewChild(MatSidenav);

  alternarMenu(): void {
    void this.lateral()?.toggle();
  }

  cerrarMenuEnMovil(): void {
    if (!this.esEscritorio()) {
      void this.lateral()?.close();
    }
  }

  irACambioDeClave(): void {
    void this.router.navigateByUrl(RUTA_CAMBIO_CLAVE);
  }

  cerrarSesion(): void {
    this.autenticacion.cerrarSesion().subscribe();
  }
}
