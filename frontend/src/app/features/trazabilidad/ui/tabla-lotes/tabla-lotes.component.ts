import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LoteFila } from '@models/lote.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { FichaEstado, fichaEstadoLote } from '@shared/utils/presentacion-lote';
import { FichaComponent } from '@shared/components/ficha/ficha.component';

/**
 * Lotes como la tabla de la maqueta (`pLotes`): nombre con su código debajo, mineral, apertura,
 * ingresos, toneladas y la ficha de estado; la fila entera abre el lote (HU-M06-01).
 * Presentacional.
 */
@Component({
  selector: 'app-tabla-lotes',
  standalone: true,
  imports: [FichaComponent, RouterLink, FechaLimaPipe, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-lotes.component.html',
  styles: `
    :host {
      display: block;
    }
    .codigo {
      font-weight: 400;
    }
  `,
})
export class TablaLotesComponent {
  readonly lotes = input.required<readonly LoteFila[]>();

  protected ficha(lote: LoteFila): FichaEstado {
    return fichaEstadoLote(lote.estado);
  }
}
