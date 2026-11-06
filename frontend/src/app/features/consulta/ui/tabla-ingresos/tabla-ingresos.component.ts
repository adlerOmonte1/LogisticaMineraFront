import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { FilaIngreso } from '@models/consulta.model';
import { ETIQUETA_TITULARIDAD } from '@models/vehiculo.model';
import { InsigniaIngresoComponent } from '@shared/components/insignia-ingreso/insignia-ingreso.component';
import { MarcaSinRespaldoComponent } from '@shared/components/marca-sin-respaldo/marca-sin-respaldo.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Filas de ingresos de la consulta, el listado, el calendario y el inicio. Con la fila sola se
 * distinguen, sin abrir el detalle, el anulado (y su motivo), el En proceso («pendiente del
 * destare», sin peso neto) y el que se registró sin foto (RNF-M03-16, HU-M07-01 CA05, CA08,
 * CA09). Con `seleccionable`, cada fila ofrece «Ver ticket». Presentacional.
 */
@Component({
  selector: 'app-tabla-ingresos',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    FechaLimaPipe,
    InsigniaIngresoComponent,
    MarcaSinRespaldoComponent,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-ingresos.component.html',
  styles: `
    :host {
      display: block;
    }
    .placa {
      white-space: nowrap;
    }
    .enlace-codigo {
      color: inherit;
      text-decoration: none;
      &:hover {
        color: var(--link);
        text-decoration: underline;
      }
    }
    .estado {
      white-space: normal;
    }
    .motivo {
      margin-top: 2px;
      font-weight: 500;
      color: var(--red);
    }
    .fila--elegida td {
      background: var(--accent-tint);
    }
    .fila--elegida td:first-child {
      box-shadow: inset 3px 0 0 var(--gold);
    }
  `,
})
export class TablaIngresosComponent {
  readonly filas = input.required<readonly FilaIngreso[]>();
  /** Id de la fila abierta, para resaltarla. */
  readonly seleccionada = input<number | null>(null);
  readonly seleccionable = input(false);
  /** Sin la fecha ni el tipo de vehículo: el inicio y el día del calendario ya los dan por sabidos. */
  readonly compacta = input(false);

  readonly elegir = output<FilaIngreso>();

  protected textoTitularidad(fila: FilaIngreso): string {
    return ETIQUETA_TITULARIDAD[fila.tipo_vehiculo];
  }
}
