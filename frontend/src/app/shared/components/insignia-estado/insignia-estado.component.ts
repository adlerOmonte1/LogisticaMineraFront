import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type TonoInsignia = 'exito' | 'aviso' | 'error' | 'info' | 'neutro';

const ICONO_POR_TONO: Readonly<Record<TonoInsignia, string>> = {
  exito: 'check_circle',
  aviso: 'schedule',
  error: 'cancel',
  info: 'info',
  neutro: 'remove_circle_outline',
};

/**
 * Estado de un registro (activo, inactivo, pendiente de destare, anulado…). Lleva icono y
 * texto, nunca solo color (RNF-M04-09, RNF-M07-11).
 */
@Component({
  selector: 'app-insignia-estado',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'insignia insignia--' + tono()">
      <mat-icon class="insignia__icono" aria-hidden="true">{{ iconoVisible() }}</mat-icon>
      {{ texto() }}
    </span>
  `,
  styles: `
    .insignia {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px 2px 6px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .insignia__icono {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    .insignia--exito {
      color: var(--green);
      background: color-mix(in srgb, var(--green-b) 14%, transparent);
    }
    .insignia--aviso {
      color: var(--orange);
      background: color-mix(in srgb, var(--orange-b) 16%, transparent);
    }
    .insignia--error {
      color: var(--red);
      background: color-mix(in srgb, var(--red-b) 14%, transparent);
    }
    .insignia--info {
      color: var(--blue);
      background: color-mix(in srgb, var(--blue-b) 14%, transparent);
    }
    .insignia--neutro {
      color: var(--gray);
      background: var(--fill);
    }
  `,
})
export class InsigniaEstadoComponent {
  readonly texto = input.required<string>();
  readonly tono = input<TonoInsignia>('neutro');
  readonly icono = input<string | null>(null);

  readonly iconoVisible = computed(() => this.icono() ?? ICONO_POR_TONO[this.tono()]);
}
