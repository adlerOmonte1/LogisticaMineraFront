import { ChangeDetectionStrategy, Component, HostBinding, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type ColorAviso = 'green' | 'orange' | 'blue' | 'gray';

/**
 * Aviso en franja de la maqueta (`banner`): icono, texto proyectado y un borde de color a la
 * izquierda. Para informar el estado de una pantalla, no para errores del servidor
 * (`aviso-error`). Presentacional.
 */
@Component({
  selector: 'app-aviso-franja',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-icon class="aviso__icono" aria-hidden="true">{{ icono() }}</mat-icon>
    <div class="aviso__texto"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 4px;
      border-left: 3px solid currentColor;
      font-size: 14px;
      font-weight: 500;
    }
    .aviso__icono {
      flex: none;
    }
    .aviso__texto {
      flex: 1;
      min-width: 0;
    }
    :host(.aviso--orange) {
      background: color-mix(in srgb, var(--orange-b) 10%, var(--surface));
      color: var(--orange);
    }
    :host(.aviso--green) {
      background: color-mix(in srgb, var(--green) 9%, var(--surface));
      color: var(--green);
    }
    :host(.aviso--blue) {
      background: color-mix(in srgb, var(--gold) 12%, var(--surface));
      color: var(--link);
    }
    :host(.aviso--gray) {
      background: var(--surface-2);
      color: var(--label-2);
    }
  `,
})
export class AvisoFranjaComponent {
  readonly color = input<ColorAviso>('gray');
  readonly icono = input('info');

  @HostBinding('class')
  protected get clase(): string {
    return `aviso aviso--${this.color()}`;
  }
}
