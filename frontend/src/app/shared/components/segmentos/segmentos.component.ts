import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface OpcionSegmento<T> {
  valor: T;
  texto: string;
}

/**
 * Botones segmentados de la maqueta (`segBtns`): una sola opción activa, con el texto siempre a la
 * vista. Sirve de filtro por estado en las listas. Presentacional.
 */
@Component({
  selector: 'app-segmentos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="tablist" [attr.aria-label]="etiqueta()" data-prueba="segmentos">
      @for (opcion of opciones(); track $index) {
        <button
          type="button"
          role="tab"
          [class.on]="opcion.valor === valor()"
          [attr.aria-selected]="opcion.valor === valor()"
          [attr.data-prueba]="'segmento-' + (opcion.valor ?? 'todos')"
          (click)="cambio.emit(opcion.valor)"
        >
          {{ opcion.texto }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      max-width: 100%;
    }
    .seg {
      display: inline-flex;
      max-width: 100%;
      overflow-x: auto;
      border: 1px solid var(--stroke);
      border-radius: 4px;
      background: var(--surface);
      scrollbar-width: none;
    }
    button {
      padding: 7px 15px;
      border: 0;
      border-right: 1px solid var(--stroke);
      background: none;
      color: var(--label-2);
      font: 500 13.5px var(--font);
      white-space: nowrap;
      cursor: pointer;
      &:last-child {
        border-right: 0;
      }
      &:hover {
        background: var(--hover);
        color: var(--label);
      }
      &.on {
        background: var(--ink);
        color: #fff;
        font-weight: 600;
      }
    }
  `,
})
export class SegmentosComponent<T = string | null> {
  readonly opciones = input.required<readonly OpcionSegmento<T>[]>();
  readonly valor = input<T | null>(null);
  readonly etiqueta = input('Filtro');

  readonly cambio = output<T>();
}
