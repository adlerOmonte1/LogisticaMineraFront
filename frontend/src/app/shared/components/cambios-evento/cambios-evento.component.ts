import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CambioEvento } from '@models/evento.model';
import { etiquetaCampo, textoValor } from '@shared/utils/presentacion-evento';

/**
 * Qué cambió en un evento: por campo, el valor anterior y el nuevo (HU-M09-02 CA02,
 * HU-M09-03 CA03). Presentacional. Los textos «Antes» y «Después» van escritos, no solo
 * sugeridos por posición o color.
 */
@Component({
  selector: 'app-cambios-evento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cambios().length > 0) {
      <ul class="cambios" data-prueba="cambios">
        @for (cambio of cambios(); track cambio.campo) {
          <li class="cambio" data-prueba="cambio">
            <span class="cambio__campo">{{ nombre(cambio) }}</span>
            <span class="cambio__valor">
              <span class="cambio__rotulo">Antes</span>
              <span data-prueba="antes">{{ texto(cambio.anterior) }}</span>
            </span>
            <span class="cambio__valor">
              <span class="cambio__rotulo">Después</span>
              <span data-prueba="despues">{{ texto(cambio.nuevo) }}</span>
            </span>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .cambios {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .cambio {
      display: grid;
      gap: 2px 16px;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--surface-2);
      overflow-wrap: anywhere;
    }
    .cambio__campo {
      font-weight: 600;
    }
    .cambio__valor {
      display: flex;
      gap: 8px;
    }
    .cambio__rotulo {
      min-width: 56px;
      color: var(--label-3);
      font-size: 0.8rem;
    }
    @media (min-width: 768px) {
      .cambio {
        grid-template-columns: 1fr 1fr 1fr;
        align-items: baseline;
      }
    }
  `,
})
export class CambiosEventoComponent {
  readonly cambios = input.required<readonly CambioEvento[]>();

  protected nombre(cambio: CambioEvento): string {
    return etiquetaCampo(cambio.campo);
  }

  protected texto(valor: unknown): string {
    return textoValor(valor);
  }
}
