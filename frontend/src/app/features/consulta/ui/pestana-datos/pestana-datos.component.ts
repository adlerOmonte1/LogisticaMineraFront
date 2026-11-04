import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DetalleIngreso } from '@models/detalle-ingreso.model';
import { ETIQUETA_TITULARIDAD } from '@models/vehiculo.model';
import { MarcaSinRespaldoComponent } from '@shared/components/marca-sin-respaldo/marca-sin-respaldo.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Los datos del ingreso. Las tres marcas de tiempo se muestran como tres valores distintos
 * —el pesaje, el inicio y el fin del registro— y ninguna se edita (HU-M03-01 CA09, D-01).
 * Tara y peso neto son de solo lectura: los calcula el servidor (D-17).
 */
@Component({
  selector: 'app-pestana-datos',
  standalone: true,
  imports: [FechaLimaPipe, ToneladasPipe, MarcaSinRespaldoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pestana-datos.component.html',
  styleUrl: './pestana-datos.component.scss',
})
export class PestanaDatosComponent {
  readonly detalle = input.required<DetalleIngreso>();

  protected readonly etiquetaTitularidad = ETIQUETA_TITULARIDAD;
}
