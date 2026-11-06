import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ParteLote, RegistroBigbags } from '@models/lote.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { aCentesimas, deCentesimas } from '@shared/utils/decimal';
import { FichaComponent } from '@shared/components/ficha/ficha.component';

/**
 * Tabla «Bigbags» de la maqueta: cada registro con su parte, si el peso lo calculó el sistema o se
 * recalculó, la cantidad, el peso aproximado por bigbag y el total aproximado. Todo peso de un
 * bigbag es estimación (HU-M06-02 CA11, RNF-M06-09). Presentacional.
 */
@Component({
  selector: 'app-bigbags-lote',
  standalone: true,
  imports: [FichaComponent, FechaLimaPipe, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-card lm-card--plana">
      <div class="lm-scroll">
        <table class="lm-tabla">
          <thead>
            <tr>
              <th>Parte</th>
              <th>Cálculo</th>
              <th class="r">Cantidad</th>
              <th class="r">Peso aprox. c/u</th>
              <th class="r">Total aprox.</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            @for (fila of filas(); track fila.registro.id) {
              <tr data-prueba="bigbags">
                <td class="main" data-l="">{{ fila.parte }}</td>
                <td data-l="Cálculo">
                  @if (fila.registro.recalculado) {
                    <app-ficha color="orange">Recalculado</app-ficha>
                  } @else {
                    <app-ficha color="gray">Calculado por el sistema</app-ficha>
                  }
                </td>
                <td class="r" data-l="Cantidad">{{ fila.registro.cantidad }}</td>
                <td class="r" data-l="Peso c/u" data-prueba="peso-bigbag">
                  ≈ {{ fila.registro.peso_aproximado_tn | toneladas }}
                </td>
                <td class="r" data-l="Total">≈ {{ fila.total | toneladas }}</td>
                <td class="lm-num" data-l="Registro">{{ fila.registro.fecha_hora | fechaLima }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <p class="lm-xs lm-faint nota">Pesos aproximados: estimación a partir de lo registrado, no una pesada.</p>
  `,
  styles: `
    .nota {
      margin: 6px 0 0;
    }
  `,
})
export class BigbagsLoteComponent {
  readonly bigbags = input.required<readonly RegistroBigbags[]>();
  readonly partes = input<readonly ParteLote[]>([]);

  protected readonly filas = computed(() => {
    const nombres = new Map(this.partes().map((p) => [p.id, p.nombre]));
    return this.bigbags().map((registro) => ({
      registro,
      parte: registro.parte === null ? 'Lote completo' : (nombres.get(registro.parte) ?? 'Parte'),
      total: deCentesimas(registro.cantidad * (aCentesimas(registro.peso_aproximado_tn) ?? 0)),
    }));
  });
}
