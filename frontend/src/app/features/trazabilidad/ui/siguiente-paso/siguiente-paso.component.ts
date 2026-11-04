import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { EtapaCatalogo, SiguientePaso } from '@models/lote.model';

/**
 * «Siguiente paso»: un botón por carga con lo que corresponde registrar, construido **solo** con
 * `siguientes` del servidor (RNF-M06-07). El cliente no calcula qué etapa sigue: ni la deduce
 * del recorrido ni la ordena. Si `elegir_ruta`, el botón pide la ruta en lugar de una etapa
 * (HU-M06-02 CA02). Todos los roles lo ven (HU-M06-02). Presentacional.
 */
@Component({
  selector: 'app-siguiente-paso',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (siguientes().length > 0) {
      <section class="tarjeta" aria-labelledby="titulo-siguiente">
        <h2 id="titulo-siguiente" class="titulo">Siguiente paso</h2>
        <ul class="acciones">
          @for (paso of siguientes(); track $index) {
            <li>
              <button
                mat-flat-button
                color="primary"
                type="button"
                class="accion"
                data-prueba="siguiente"
                (click)="registrar.emit(paso)"
              >
                <mat-icon>arrow_forward</mat-icon>
                {{ texto(paso) }}
              </button>
              <span class="carga texto-secundario" data-prueba="carga">{{ paso.carga }}</span>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .titulo {
      margin: 0 0 12px;
      font-size: 1.1rem;
    }
    .acciones {
      display: grid;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .accion {
      min-height: var(--altura-toque);
    }
    .carga {
      margin-left: 12px;
    }
  `,
})
export class SiguientePasoComponent {
  readonly siguientes = input.required<readonly SiguientePaso[]>();
  readonly etapas = input<readonly EtapaCatalogo[]>([]);

  readonly registrar = output<SiguientePaso>();

  private readonly nombres = computed(() => new Map(this.etapas().map((e) => [e.codigo, e.nombre])));

  protected texto(paso: SiguientePaso): string {
    if (paso.elegir_ruta) {
      return 'Elegir la ruta';
    }
    const etapa = paso.etapa ? (this.nombres().get(paso.etapa) ?? paso.etapa) : '';
    return `Registrar ${etapa.toLowerCase()}`;
  }
}
