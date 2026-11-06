import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { Consolidado } from '@models/consolidacion.model';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Total del mes por tipo de mineral: ingresos, toneladas netas y participación, con la fila de
 * total (HU-M08-01 CA01). Las mismas columnas que el archivo exportado, en el mismo orden, para
 * que se comparen fila por fila (HU-M08-02 CA03). Las cifras son las del servidor: aquí no se
 * suma ni se redondea nada. Presentacional.
 */
@Component({
  selector: 'app-tabla-consolidado',
  standalone: true,
  imports: [MatTableModule, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table mat-table [dataSource]="consolidado().tipos_mineral" class="tabla">
      <ng-container matColumnDef="codigo">
        <th mat-header-cell *matHeaderCellDef>Código</th>
        <td mat-cell *matCellDef="let fila" class="monoespaciado" data-prueba="codigo">{{ fila.codigo }}</td>
        <td mat-footer-cell *matFooterCellDef></td>
      </ng-container>
      <ng-container matColumnDef="nombre">
        <th mat-header-cell *matHeaderCellDef>Tipo de mineral</th>
        <td mat-cell *matCellDef="let fila" data-prueba="nombre">
          <strong>{{ fila.nombre }}</strong>
        </td>
        <td mat-footer-cell *matFooterCellDef><strong>Total</strong></td>
      </ng-container>
      <ng-container matColumnDef="ingresos">
        <th mat-header-cell *matHeaderCellDef class="numero">Ingresos</th>
        <td mat-cell *matCellDef="let fila" class="numero" data-etiqueta="Ingresos" data-prueba="ingresos">
          {{ fila.ingresos }}
        </td>
        <td
          mat-footer-cell
          *matFooterCellDef
          class="numero"
          data-etiqueta="Ingresos"
          data-prueba="total-ingresos"
        >
          <strong>{{ consolidado().total_ingresos }}</strong>
        </td>
      </ng-container>
      <ng-container matColumnDef="toneladas">
        <th mat-header-cell *matHeaderCellDef class="numero">Toneladas netas</th>
        <td
          mat-cell
          *matCellDef="let fila"
          class="numero monoespaciado"
          data-etiqueta="Toneladas"
          data-prueba="toneladas"
        >
          {{ fila.toneladas | toneladas }}
        </td>
        <td
          mat-footer-cell
          *matFooterCellDef
          class="numero monoespaciado"
          data-etiqueta="Toneladas"
          data-prueba="total-toneladas"
        >
          <strong>{{ consolidado().total_toneladas | toneladas }}</strong>
        </td>
      </ng-container>
      <ng-container matColumnDef="participacion">
        <th mat-header-cell *matHeaderCellDef class="numero">Participación</th>
        <td
          mat-cell
          *matCellDef="let fila"
          class="numero monoespaciado"
          data-etiqueta="Participación"
          data-prueba="participacion"
        >
          {{ fila.participacion }} %
        </td>
        <td mat-footer-cell *matFooterCellDef class="numero monoespaciado" data-etiqueta="Participación">
          <strong>100 %</strong>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columnas"></tr>
      <tr mat-row *matRowDef="let fila; columns: columnas" data-prueba="fila-mineral"></tr>
      <tr mat-footer-row *matFooterRowDef="columnas" data-prueba="fila-total"></tr>
    </table>
  `,
  styles: `
    :host {
      display: block;
      overflow-x: auto;
    }
    .numero {
      text-align: right;
    }
  `,
})
export class TablaConsolidadoComponent {
  readonly consolidado = input.required<Consolidado>();

  protected readonly columnas = ['codigo', 'nombre', 'ingresos', 'toneladas', 'participacion'];
}
