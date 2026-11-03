import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EstadoVacioComponent } from '@shared/components/estado-vacio/estado-vacio.component';

export interface DatosPantallaPendiente {
  titulo: string;
  fase: string;
}

/**
 * Pantalla de una fase posterior del plan. Mantiene el menú de cada rol completo desde FB1
 * —lo exige HU-M01-03 CA01— sin mostrar una ruta rota. Se reemplaza al construir su fase.
 */
@Component({
  selector: 'app-pantalla-pendiente',
  standalone: true,
  imports: [RouterLink, MatButtonModule, EncabezadoPaginaComponent, EstadoVacioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (datos(); as datos) {
      <app-encabezado-pagina [titulo]="datos.titulo" />
      <section class="tarjeta">
        <app-estado-vacio
          icono="construction"
          [mensaje]="'Esta pantalla se construye en la fase ' + datos.fase"
        >
          <a mat-stroked-button routerLink="/inicio">Volver al inicio</a>
        </app-estado-vacio>
      </section>
    }
  `,
})
export class PantallaPendientePage {
  protected readonly datos = toSignal(
    inject(ActivatedRoute).data.pipe(map((datos) => datos as DatosPantallaPendiente)),
  );
}
