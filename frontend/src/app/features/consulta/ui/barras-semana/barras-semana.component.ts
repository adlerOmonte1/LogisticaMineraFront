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
        <li class="barras__dia" [class.barras__dia--hoy]="$last" data-prueba="barra">
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
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 190px;
      margin: 0;
      padding: 8px 0 0;
      list-style: none;
      border-bottom: 1px solid var(--border);
    }
    .barras__dia {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      min-width: 0;
      height: 100%;
    }
    .barras__valor {
      font: 600 13px var(--font-d);
      color: var(--label-2);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .barras__area {
      display: flex;
      align-items: flex-end;
      width: 100%;
      max-width: 46px;
      height: 120px;
    }
    .barras__barra {
      width: 100%;
      min-height: 0;
      border-radius: 2px 2px 0 0;
      background: color-mix(in srgb, var(--gold) 45%, transparent);
    }
    .barras__dia--hoy .barras__barra {
      background: var(--gold);
    }
    .barras__etiqueta {
      padding-bottom: 6px;
      color: var(--label-3);
      font-size: 12px;
      text-transform: capitalize;
      white-space: nowrap;
    }
    @media (max-width: 767px) {
      .barras {
        gap: 6px;
      }
      .barras__valor {
        font-size: 11px;
      }
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
