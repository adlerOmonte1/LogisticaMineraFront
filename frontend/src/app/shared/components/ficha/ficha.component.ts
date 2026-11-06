import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';

import { ColorFicha } from '@shared/utils/presentacion-lote';

/**
 * Ficha de estado de la maqueta (`pill`): texto sobre un tinte de color, con un punto opcional.
 * El color nunca va solo, siempre acompaña al texto (RNF-M07-11). Presentacional.
 */
@Component({
  selector: 'app-ficha',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (punto()) {
      <i class="ficha__punto" aria-hidden="true"></i>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 3px;
      border: 1px solid transparent;
      font-size: 12.5px;
      font-weight: 600;
      line-height: 1.45;
      white-space: nowrap;
      vertical-align: middle;
    }
    .ficha__punto {
      width: 7px;
      height: 7px;
      border-radius: 1px;
      background: currentColor;
    }
    :host(.ficha--green) {
      background: color-mix(in srgb, var(--green) 11%, transparent);
      color: var(--green);
      border-color: color-mix(in srgb, var(--green) 22%, transparent);
    }
    :host(.ficha--orange) {
      background: color-mix(in srgb, var(--orange-b) 13%, transparent);
      color: var(--orange);
      border-color: color-mix(in srgb, var(--orange-b) 28%, transparent);
    }
    :host(.ficha--red) {
      background: color-mix(in srgb, var(--red) 10%, transparent);
      color: var(--red);
      border-color: color-mix(in srgb, var(--red) 22%, transparent);
    }
    :host(.ficha--blue) {
      background: color-mix(in srgb, var(--blue) 10%, transparent);
      color: var(--blue);
      border-color: color-mix(in srgb, var(--blue) 22%, transparent);
    }
    :host(.ficha--purple) {
      background: color-mix(in srgb, var(--purple) 11%, transparent);
      color: var(--purple);
      border-color: color-mix(in srgb, var(--purple) 24%, transparent);
    }
    :host(.ficha--gray) {
      background: var(--fill);
      color: var(--gray);
      border-color: var(--stroke);
    }
  `,
})
export class FichaComponent {
  readonly color = input<ColorFicha>('gray');
  readonly punto = input(false);

  @HostBinding('class')
  protected get clase(): string {
    return `ficha ficha--${this.color()}`;
  }
}
