import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ETIQUETA_DESTINO, LoteFila, ResumenLote } from '@models/lote.model';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { FichaComponent } from '@shared/components/ficha/ficha.component';

export type ModoCierre = 'listos' | 'proceso' | 'cerrados';

/**
 * Una de las tres tablas de «Cierre de lotes» de la maqueta (`pAltas`): lote con su código y
 * mineral, toneladas registradas, bigbags y el estado —«Listo para cerrar», lo primero que falta
 * según el servidor, o el destino del lote cerrado—. La fila abre el resumen de cierre
 * (HU-M06-05). Presentacional.
 */
@Component({
  selector: 'app-tabla-cierre',
  standalone: true,
  imports: [FichaComponent, RouterLink, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-scroll">
      <table class="lm-tabla">
        <thead>
          <tr>
            <th>Lote</th>
            <th class="r">Toneladas registradas</th>
            <th class="r">Bigbags</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (lote of lotes(); track lote.id) {
            <tr class="click" [routerLink]="['/lotes', lote.id, 'cerrar']" data-prueba="fila-cierre">
              <td class="main" data-l="">
                <a
                  class="fila-enlace"
                  [routerLink]="['/lotes', lote.id, 'cerrar']"
                  [attr.aria-label]="'Resumen de cierre de ' + lote.nombre"
                  data-prueba="cerrar-lote"
                  >{{ lote.nombre }}</a
                >
                <div class="lm-xs lm-faint detalle" data-prueba="nombre">
                  {{ lote.codigo }}, {{ lote.tipo_mineral_nombre }}
                </div>
              </td>
              <td class="r" data-l="Registrado">{{ lote.toneladas | toneladas }}</td>
              <td class="r" data-l="Bigbags">{{ bigbags(lote) }}</td>
              <td data-l="Estado" class="estado" data-prueba="estado-cierre">
                @switch (modo()) {
                  @case ('listos') {
                    <app-ficha color="green" [punto]="true">Listo para cerrar</app-ficha>
                  }
                  @case ('cerrados') {
                    <app-ficha color="gray" [punto]="true">Cerrado · {{ destino(lote) }}</app-ficha>
                  }
                  @default {
                    <span class="lm-small lm-muted">{{ pendiente(lote) }}</span>
                  }
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .detalle {
      font-weight: 400;
    }
    .estado {
      white-space: normal;
    }
  `,
})
export class TablaCierreComponent {
  readonly lotes = input.required<readonly LoteFila[]>();
  /** Resumen por id de lote: sin clave, todavía no llegó; `null`, no se pudo leer. */
  readonly resumenes = input<Readonly<Record<number, ResumenLote | null>>>({});
  readonly modo = input<ModoCierre>('proceso');

  protected bigbags(lote: LoteFila): string {
    const resumen = this.resumenes()[lote.id];
    return resumen && resumen.bigbags > 0 ? String(resumen.bigbags) : '—';
  }

  protected destino(lote: LoteFila): string {
    return lote.destino ? ETIQUETA_DESTINO[lote.destino] : 'sin destino';
  }

  /** «Falta el secado del lote y 2 más», con el texto del servidor. */
  protected pendiente(lote: LoteFila): string {
    const resumen = this.resumenes()[lote.id];
    if (resumen === undefined) {
      return 'Calculando…';
    }
    if (resumen === null) {
      return 'No disponible';
    }
    const [primero, ...resto] = resumen.pendientes;
    const texto = primero ? primero.charAt(0).toUpperCase() + primero.slice(1) : '';
    return resto.length > 0 ? `${texto} y ${resto.length} más` : texto;
  }
}
