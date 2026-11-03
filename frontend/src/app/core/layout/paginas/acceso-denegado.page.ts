import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { EstadoVacioComponent } from '@shared/components/estado-vacio/estado-vacio.component';

/**
 * Pantalla a la que lleva una ruta forzada fuera del rol (HU-M01-03 CA02). El servidor
 * rechaza igual la operación con su 403.
 */
@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [RouterLink, MatButtonModule, EstadoVacioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta">
      <app-estado-vacio icono="block" mensaje="Acción no autorizada">
        <p class="texto-secundario">Su rol no tiene acceso a esta pantalla.</p>
        <a mat-flat-button color="primary" routerLink="/inicio">Ir al inicio</a>
      </app-estado-vacio>
    </section>
  `,
})
export class AccesoDenegadoPage {}
