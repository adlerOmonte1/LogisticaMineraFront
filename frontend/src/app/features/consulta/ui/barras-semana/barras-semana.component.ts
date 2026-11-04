import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

interface Barra {
  etiqueta: string;
  toneladas: string;
  /** Alto en porcentaje del área, proporcional al mayor de la semana. */
  altura: number;
}

const FORMATO_DIA = new Intl.DateTimeFormat('es-PE', {
  weekday: 'short',
  day: '2-digit',
  timeZone: 'America/Lima',
});

/** Un tramo no vacío siempre se ve, aunque sea mínimo, frente al mayor de la semana. */
const ALTURA_MINIMA = 4;

/**
 * Toneladas de los últimos siete días en barras dibujadas con CSS, sin librería de gráficos
 * (D-F04). La cifra de cada día está escrita bajo su barra: la altura ayuda, pero no es el único
 * dato (HU-M07-04 CA04). El criterio es el del calendario, así que un día coincide con él.
 * Presentacional.
 */
@Component({
  selector: 'app-barras-semana',
  standalone: true,
  imports: [ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="barras" aria-label="Toneladas de los últimos siete días">
      @for (barra of barras(); track $index) {
        <li class="barras__dia" data-prueba="barra">
          <span class="barras__valor" data-prueba="barra-valor">{{ barra.toneladas | toneladas }}</span>
          <span class="barras__area">
            <span class="barras__barra" [style.height.%]="barra.altura"></span>
          </span>
          <span class="barras__etiqueta" data-prueba="barra-dia">{{ barra.etiqueta }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .barras {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .barras__dia {
      display: grid;
      justify-items: center;
      gap: 4px;
    }
    .barras__valor {
      font-size: 0.7rem;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .barras__area {
      display: flex;
      align-items: flex-end;
      width: 100%;
      height: 96px;
      border-bottom: 1px solid var(--border);
    }
    .barras__barra {
      width: 100%;
      border-radius: 4px 4px 0 0;
      background: var(--gold);
    }
    .barras__etiqueta {
      color: var(--label-2);
      font-size: 0.75rem;
      text-transform: capitalize;
    }
  `,
})
export class BarrasSemanaComponent {
  readonly dias = input.required<readonly { fecha: string; toneladas: string }[]>();

  protected readonly barras = computed<Barra[]>(() => {
    const dias = this.dias();
    const mayor = Math.max(0, ...dias.map((d) => Number(d.toneladas)));
    return dias.map((dia) => {
      const valor = Number(dia.toneladas);
      return {
        etiqueta: FORMATO_DIA.format(new Date(`${dia.fecha}T12:00:00-05:00`)).replace(',', ''),
        toneladas: dia.toneladas,
        altura: mayor > 0 && valor > 0 ? Math.max((valor / mayor) * 100, ALTURA_MINIMA) : 0,
      };
    });
  });
}
