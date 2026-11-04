import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Ingreso } from '@models/ingreso.model';
import { InsigniaIngresoComponent } from '@shared/components/insignia-ingreso/insignia-ingreso.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/** El ingreso sobre el que se actúa, para no corregir, revertir ni anular a ciegas. */
@Component({
  selector: 'app-resumen-ingreso',
  standalone: true,
  imports: [FechaLimaPipe, ToneladasPipe, InsigniaIngresoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta resumen" data-prueba="resumen-ingreso">
      <header>
        <strong class="monoespaciado">{{ ingreso().codigo }}</strong>
        <app-insignia-ingreso [estado]="ingreso().estado" />
      </header>
      <dl>
        <div>
          <dt>Placa</dt>
          <dd class="monoespaciado">{{ ingreso().placa }}</dd>
        </div>
        <div>
          <dt>Mineral</dt>
          <dd>{{ ingreso().tipo_mineral_nombre }}</dd>
        </div>
        <div>
          <dt>Pesaje</dt>
          <dd>{{ ingreso().fecha_hora_pesaje | fechaLima }}</dd>
        </div>
        <div>
          <dt>Peso bruto</dt>
          <dd class="monoespaciado">{{ ingreso().peso_bruto_tn | toneladas }}</dd>
        </div>
        <div>
          <dt>Peso neto</dt>
          <dd class="monoespaciado">
            {{ ingreso().peso_neto_tn ? (ingreso().peso_neto_tn | toneladas) : 'Pendiente del destare' }}
          </dd>
        </div>
      </dl>
    </section>
  `,
  styles: `
    .resumen {
      display: grid;
      gap: 8px;
      margin-bottom: 16px;
    }
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.1rem;
    }
    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px 16px;
      margin: 0;
    }
    dt {
      font-size: 0.75rem;
      color: var(--label-3);
    }
    dd {
      margin: 0;
      font-weight: 600;
    }
  `,
})
export class ResumenIngresoComponent {
  readonly ingreso = input.required<Ingreso>();
}
