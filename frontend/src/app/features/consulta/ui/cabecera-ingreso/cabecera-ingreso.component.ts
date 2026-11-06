import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { SiPuedeDirective } from '@core/autorizacion/si-puede.directive';
import { DetalleIngreso } from '@models/detalle-ingreso.model';
import { AvisoFranjaComponent } from '@shared/components/aviso-franja/aviso-franja.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { InsigniaIngresoComponent } from '@shared/components/insignia-ingreso/insignia-ingreso.component';
import { MarcaSinRespaldoComponent } from '@shared/components/marca-sin-respaldo/marca-sin-respaldo.component';

/**
 * Cabecera del detalle: código, estado y las acciones sobre el ingreso. Cada acción se ofrece
 * solo al rol que la tiene (HU-M03-02 CA06, HU-M03-03 CA04) y solo si el ingreso lo permite;
 * el servidor las rechaza igual. Navegan por URL a las páginas de `ingresos` (D-F08).
 */
@Component({
  selector: 'app-cabecera-ingreso',
  standalone: true,
  imports: [
    RouterLink,
    AvisoFranjaComponent,
    FechaLimaPipe,
    MatButtonModule,
    MatIconModule,
    SiPuedeDirective,
    InsigniaIngresoComponent,
    MarcaSinRespaldoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cabecera-ingreso.component.html',
  styleUrl: './cabecera-ingreso.component.scss',
})
export class CabeceraIngresoComponent {
  readonly detalle = input.required<DetalleIngreso>();

  protected readonly anulado = computed(() => this.detalle().estado === 'ANULADO');
  protected readonly puedeRevertir = computed(
    () => !this.anulado() && this.detalle().correccion_revertible !== null,
  );
}
