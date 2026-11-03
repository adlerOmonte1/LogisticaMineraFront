import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AutorizacionService } from '@core/autorizacion/autorizacion.service';
import { ACCION_PRINCIPAL, NAVEGACION, filtrarPorPermiso } from '@core/layout/navegacion';
import { SesionService } from '@core/sesion/sesion.service';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EtiquetaRolPipe } from '@shared/pipes/etiqueta-rol.pipe';

/**
 * Pantalla de entrada de cada rol (HU-M01-01 CA01). En FB1 es mínima: saludo y accesos de
 * su menú. El resumen del día y los avisos se construyen en FB6 (HU-M07-04).
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, EncabezadoPaginaComponent, EtiquetaRolPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (usuario(); as usuario) {
      <app-encabezado-pagina
        [titulo]="'Hola, ' + (usuario.nombre_completo || usuario.username)"
        [subtitulo]="usuario.rol | etiquetaRol"
      >
        @if (accionPrincipal(); as accion) {
          <a mat-flat-button color="primary" [routerLink]="accion.ruta">
            <mat-icon>{{ accion.icono }}</mat-icon>
            {{ accion.etiqueta }}
          </a>
        }
      </app-encabezado-pagina>
    }
    <section class="accesos" aria-label="Accesos de su rol">
      @for (item of accesos(); track item.ruta) {
        <a class="tarjeta acceso" [routerLink]="item.ruta">
          <mat-icon aria-hidden="true">{{ item.icono }}</mat-icon>
          <span>{{ item.etiqueta }}</span>
        </a>
      }
    </section>
    <p class="texto-secundario aviso-fase">
      El resumen del día y los avisos de pendientes llegan en la fase FB6.
    </p>
  `,
  styles: `
    .accesos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
    .acceso {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 64px;
      color: var(--label);
      text-decoration: none;
      font-weight: 600;
    }
    .acceso mat-icon {
      color: var(--accent);
    }
    .acceso:hover,
    .acceso:focus-visible {
      border-color: var(--gold);
    }
    .aviso-fase {
      margin-top: 24px;
    }
  `,
})
export class InicioPage {
  private readonly autorizacion = inject(AutorizacionService);

  protected readonly usuario = inject(SesionService).usuario;
  protected readonly accesos = computed(() =>
    filtrarPorPermiso(NAVEGACION, (permiso) => this.autorizacion.puede(permiso)).filter(
      (item) => item.ruta !== '/inicio',
    ),
  );
  protected readonly accionPrincipal = computed(() =>
    this.autorizacion.puede(ACCION_PRINCIPAL.permiso) ? ACCION_PRINCIPAL : null,
  );
}
