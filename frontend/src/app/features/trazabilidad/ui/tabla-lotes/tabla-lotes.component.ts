import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { LoteFila } from '@models/lote.model';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { PresentacionEstado, presentarEstadoLote } from '@shared/utils/presentacion-lote';

/** Lotes con su estado, mineral, ingresos y toneladas (HU-M06-01). Presentacional. */
@Component({
  selector: 'app-tabla-lotes',
  standalone: true,
  imports: [
    MatButtonModule,
    MatTableModule,
    RouterLink,
    InsigniaEstadoComponent,
    FechaLimaPipe,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-lotes.component.html',
  styles: `
    :host {
      display: block;
      overflow-x: auto;
    }
  `,
})
export class TablaLotesComponent {
  readonly lotes = input.required<readonly LoteFila[]>();

  protected readonly columnas = [
    'codigo',
    'nombre',
    'estado',
    'mineral',
    'ingresos',
    'toneladas',
    'apertura',
    'ver',
  ];

  protected estado(lote: LoteFila): PresentacionEstado {
    return presentarEstadoLote(lote.estado);
  }
}
