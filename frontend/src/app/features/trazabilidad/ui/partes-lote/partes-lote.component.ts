import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ParteLote } from '@models/lote.model';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Partes en que se dividió el lote, con su fracción, su ruta y las toneladas **aproximadas**,
 * señaladas como estimación y nunca sumadas (HU-M06-04 CA08, RNF-M06-09). Presentacional.
 */
@Component({
  selector: 'app-partes-lote',
  standalone: true,
  imports: [MatIconModule, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta" aria-labelledby="titulo-partes">
      <h2 id="titulo-partes" class="titulo">Partes</h2>
      <ul class="partes">
        @for (parte of partes(); track parte.id) {
          <li class="parte" data-prueba="parte">
            <strong data-prueba="nombre">{{ parte.nombre }}</strong>
            <span data-prueba="fraccion">Fracción {{ parte.fraccion }}</span>
            <span data-prueba="ruta">{{ parte.ruta_texto }}</span>
            <span class="monoespaciado" data-prueba="toneladas">
              <mat-icon class="parte__icono" aria-hidden="true">balance</mat-icon>
              ≈ {{ parte.toneladas_aproximadas | toneladas }}
              <span class="texto-secundario">(estimación)</span>
            </span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .titulo {
      margin: 0 0 12px;
      font-size: 1.1rem;
    }
    .partes {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .parte {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 16px;
    }
    .parte__icono {
      width: 16px;
      height: 16px;
      font-size: 16px;
      vertical-align: middle;
    }
  `,
})
export class PartesLoteComponent {
  readonly partes = input.required<readonly ParteLote[]>();
}
