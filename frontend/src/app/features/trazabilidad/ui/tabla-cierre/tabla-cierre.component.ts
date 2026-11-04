import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { LoteFila, ResumenLote } from '@models/lote.model';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

type EstadoCierre = 'calculando' | 'no-disponible' | 'listo' | 'pendientes';

/**
 * Lotes en recorrido con su estado de cierre: «Listo» o cuántos pendientes tiene, según el
 * resumen que calcula el servidor (HU-M06-05). Mientras el resumen de un lote no llega —o falló—
 * se indica sin suponer nada. Presentacional.
 */
@Component({
  selector: 'app-tabla-cierre',
  standalone: true,
  imports: [MatButtonModule, MatTableModule, RouterLink, InsigniaEstadoComponent, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      overflow-x: auto;
    }
  `,
  template: `
    <table mat-table [dataSource]="lotes()" class="tabla">
      <ng-container matColumnDef="nombre">
        <th mat-header-cell *matHeaderCellDef>Lote</th>
        <td mat-cell *matCellDef="let lote" data-prueba="nombre">
          <strong>{{ lote.nombre }}</strong>
          <span class="texto-secundario monoespaciado"> {{ lote.codigo }}</span>
        </td>
      </ng-container>
      <ng-container matColumnDef="mineral">
        <th mat-header-cell *matHeaderCellDef>Mineral</th>
        <td mat-cell *matCellDef="let lote" data-etiqueta="Mineral">{{ lote.tipo_mineral_nombre }}</td>
      </ng-container>
      <ng-container matColumnDef="toneladas">
        <th mat-header-cell *matHeaderCellDef>Toneladas</th>
        <td mat-cell *matCellDef="let lote" class="monoespaciado" data-etiqueta="Toneladas">
          {{ lote.toneladas | toneladas }}
        </td>
      </ng-container>
      <ng-container matColumnDef="cierre">
        <th mat-header-cell *matHeaderCellDef>Estado del cierre</th>
        <td mat-cell *matCellDef="let lote" data-prueba="estado-cierre">
          @switch (estado(lote)) {
            @case ('calculando') {
              <span class="texto-secundario">Calculando…</span>
            }
            @case ('no-disponible') {
              <span class="texto-secundario">No disponible</span>
            }
            @case ('listo') {
              <app-insignia-estado texto="Listo para cerrar" tono="exito" />
            }
            @default {
              <app-insignia-estado [texto]="textoPendientes(lote)" tono="aviso" />
            }
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="acciones">
        <th mat-header-cell *matHeaderCellDef><span class="cdk-visually-hidden">Cerrar</span></th>
        <td mat-cell *matCellDef="let lote" class="celda-acciones">
          <a
            mat-flat-button
            color="primary"
            [routerLink]="['/lotes', lote.id, 'cerrar']"
            [attr.aria-label]="'Cerrar el lote ' + lote.nombre"
            data-prueba="cerrar-lote"
          >
            Cerrar
          </a>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columnas"></tr>
      <tr mat-row *matRowDef="let lote; columns: columnas" data-prueba="fila-cierre"></tr>
    </table>
  `,
})
export class TablaCierreComponent {
  readonly lotes = input.required<readonly LoteFila[]>();
  /** Resumen por id de lote: sin clave, todavía no llegó; `null`, no se pudo leer. */
  readonly resumenes = input.required<Readonly<Record<number, ResumenLote | null>>>();

  protected readonly columnas = ['nombre', 'mineral', 'toneladas', 'cierre', 'acciones'];

  protected estado(lote: LoteFila): EstadoCierre {
    const resumen = this.resumenes()[lote.id];
    if (resumen === undefined) {
      return 'calculando';
    }
    if (resumen === null) {
      return 'no-disponible';
    }
    return resumen.pendientes.length === 0 ? 'listo' : 'pendientes';
  }

  protected textoPendientes(lote: LoteFila): string {
    const n = this.resumenes()[lote.id]?.pendientes.length ?? 0;
    return `${n} ${n === 1 ? 'pendiente' : 'pendientes'}`;
  }
}
