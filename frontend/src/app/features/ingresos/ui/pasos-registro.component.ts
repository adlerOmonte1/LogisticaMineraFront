import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PasoRegistro } from '@models/registro-ingreso.model';

const PASOS: readonly { paso: PasoRegistro; etiqueta: string }[] = [
  { paso: 'captura', etiqueta: 'Captura' },
  { paso: 'revision', etiqueta: 'Revisión' },
  { paso: 'confirmado', etiqueta: 'Confirmación' },
];

/** Indicador de los tres pasos del registro. El actual se anuncia con `aria-current`. */
@Component({
  selector: 'app-pasos-registro',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="pasos" aria-label="Pasos del registro">
      @for (item of pasos; track item.paso; let i = $index) {
        <li
          class="pasos__item"
          [class.pasos__item--activo]="i === indice()"
          [class.pasos__item--hecho]="i < indice()"
          [attr.aria-current]="i === indice() ? 'step' : null"
        >
          <span class="pasos__numero">
            @if (i < indice()) {
              <mat-icon aria-hidden="true">check</mat-icon>
            } @else {
              {{ i + 1 }}
            }
          </span>
          {{ item.etiqueta }}
        </li>
      }
    </ol>
  `,
  styles: `
    .pasos {
      display: flex;
      gap: 8px;
      margin: 0 0 20px;
      padding: 0;
      list-style: none;
    }
    .pasos__item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 3px solid var(--fill-2);
      color: var(--label-3);
      font-weight: 500;
      font-size: 0.9rem;
    }
    .pasos__item--activo {
      border-color: var(--gold);
      color: var(--label);
      font-weight: 700;
    }
    .pasos__item--hecho {
      border-color: var(--green-b);
      color: var(--label-2);
    }
    .pasos__numero {
      display: grid;
      place-items: center;
      flex: none;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: var(--fill);
      font-size: 0.8rem;
    }
    .pasos__item--activo .pasos__numero {
      background: var(--gold);
    }
    .pasos__item--hecho .pasos__numero {
      background: var(--green-b);
      color: #ffffff;
    }
    mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    @media (max-width: 599px) {
      .pasos__item {
        font-size: 0.8rem;
      }
    }
  `,
})
export class PasosRegistroComponent {
  readonly paso = input.required<PasoRegistro>();

  protected readonly pasos = PASOS;
  protected readonly indice = computed(() => PASOS.findIndex((item) => item.paso === this.paso()));
}
