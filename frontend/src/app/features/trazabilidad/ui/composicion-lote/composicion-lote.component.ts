import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { ComposicionMineral, IngresoDeComposicion, Lote } from '@models/lote.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { FichaComponent } from '@shared/components/ficha/ficha.component';

/**
 * «Composición del lote», como la tabla de la maqueta: una fila de grupo por tipo de mineral con
 * su subtotal, sus ingresos con fichas de texto (tardío, secado propio, otro mineral, anulado, en
 * proceso) y el total del lote al pie (HU-M06-01 CA04, CA12, CA13, CA16, CA17, CA21). Con
 * `editable`, cada ingreso se puede retirar y cada mineral quitar; lo que no procede lo rechaza el
 * servidor con su mensaje (CA19). Cada código abre el detalle del ingreso. Presentacional.
 */
@Component({
  selector: 'app-composicion-lote',
  standalone: true,
  imports: [FichaComponent, MatButtonModule, RouterLink, FechaLimaPipe, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-card lm-card--plana">
      <div class="lm-scroll">
        <table class="lm-tabla">
          <thead>
            <tr>
              <th>Ingreso</th>
              <th>Fecha del pesaje</th>
              <th class="r">Peso neto</th>
              @if (editable()) {
                <th><span class="cdk-visually-hidden">Acciones</span></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (grupo of composicion(); track grupo.tipo_mineral.id) {
              <tr class="grp" data-prueba="grupo-mineral">
                <td colspan="2" data-l="">
                  <b data-prueba="mineral">{{ grupo.tipo_mineral.nombre }}</b>
                  <span class="lm-xs lm-muted" data-prueba="resumen-mineral">
                    {{ grupo.cantidad }} {{ grupo.cantidad === 1 ? 'ingreso' : 'ingresos' }}
                  </span>
                  @if (grupo.otro_mineral) {
                    <app-ficha color="purple">Otro mineral</app-ficha>
                  }
                  @if (grupo.autorizacion) {
                    <div class="lm-xs lm-muted" data-prueba="autorizacion">
                      Autorización: {{ grupo.autorizacion }}
                    </div>
                  }
                </td>
                <td class="r" data-l="Subtotal">
                  <b>{{ grupo.toneladas | toneladas }}</b>
                </td>
                @if (editable()) {
                  <td class="act">
                    <button
                      mat-button
                      type="button"
                      class="peligro"
                      data-prueba="quitar-mineral"
                      [attr.aria-label]="'Quitar el mineral ' + grupo.tipo_mineral.nombre"
                      (click)="quitarMineral.emit(grupo)"
                    >
                      Quitar
                    </button>
                  </td>
                }
              </tr>
              @for (ingreso of grupo.ingresos; track ingreso.id) {
                <tr [class.dim]="ingreso.estado === 'ANULADO'" data-prueba="ingreso">
                  <td class="main" data-l="Ingreso">
                    <a
                      class="enlace-ingreso"
                      [routerLink]="['/consulta/ingresos', ingreso.id]"
                      data-prueba="codigo"
                      >{{ ingreso.codigo }}</a
                    >
                    @if (ingreso.secado_propio) {
                      <app-ficha color="orange">Tardío · secado propio</app-ficha>
                    } @else if (ingreso.tardio) {
                      <app-ficha color="orange">Tardío</app-ficha>
                    }
                    @if (ingreso.otro_mineral) {
                      <app-ficha color="purple">Otro mineral</app-ficha>
                    }
                    @if (ingreso.estado === 'ANULADO') {
                      <app-ficha color="red">Anulado</app-ficha>
                    } @else if (ingreso.estado === 'EN_PROCESO') {
                      <app-ficha color="orange">En proceso</app-ficha>
                    }
                  </td>
                  <td class="lm-num" data-l="Fecha">{{ ingreso.fecha_hora_pesaje | fechaLima }}</td>
                  <td class="r" data-l="Peso neto">{{ ingreso.peso_neto_tn | toneladas }}</td>
                  @if (editable()) {
                    <td class="act">
                      <button
                        mat-button
                        type="button"
                        class="peligro"
                        data-prueba="retirar"
                        [attr.aria-label]="'Retirar el ingreso ' + ingreso.codigo"
                        (click)="retirar.emit(ingreso)"
                      >
                        Retirar
                      </button>
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td
                    [attr.colspan]="editable() ? 4 : 3"
                    class="lm-small lm-muted"
                    data-l=""
                    data-prueba="grupo-vacio"
                  >
                    Sin ingresos de este mineral todavía.
                  </td>
                </tr>
              }
            }
          </tbody>
          <tfoot>
            <tr data-prueba="total">
              <td colspan="2" data-l="">
                Total del lote · {{ total().ingresos }}
                {{ total().ingresos === 1 ? 'ingreso registrado' : 'ingresos registrados' }}
              </td>
              <td class="r" data-l="Total">{{ total().toneladas | toneladas }}</td>
              @if (editable()) {
                <td></td>
              }
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: `
    app-ficha {
      margin-left: 6px;
    }
    .enlace-ingreso {
      color: inherit;
      text-decoration: none;
      &:hover {
        color: var(--link);
        text-decoration: underline;
      }
    }
    .peligro {
      color: var(--red);
    }
  `,
})
export class ComposicionLoteComponent {
  readonly composicion = input.required<readonly ComposicionMineral[]>();
  readonly total = input.required<Lote['total']>();
  /** Gestión de un lote no cerrado: ofrece retirar y quitar. */
  readonly editable = input(false);

  readonly retirar = output<IngresoDeComposicion>();
  readonly quitarMineral = output<ComposicionMineral>();
}
