import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ComposicionMineral, IngresoDeComposicion, Lote } from '@models/lote.model';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Composición del lote por tipo de mineral: cada ingreso con su código, fecha y peso neto, los
 * tardíos y el «Otro mineral» señalados con texto, y los totales (HU-M06-01 CA04, CA12, CA13,
 * CA16, CA17, CA21). Con `editable`, cada ingreso se puede retirar y cada mineral quitar;
 * quitar un mineral con ingresos lo rechaza el servidor con su mensaje (CA19). Presentacional.
 */
@Component({
  selector: 'app-composicion-lote',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, FechaLimaPipe, InsigniaEstadoComponent, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta" aria-labelledby="titulo-composicion">
      <h2 id="titulo-composicion" class="titulo">Composición</h2>
      @for (grupo of composicion(); track grupo.tipo_mineral.id) {
        <div class="grupo" data-prueba="grupo-mineral">
          <div class="grupo__cabecera">
            <h3 class="grupo__nombre" data-prueba="mineral">{{ grupo.tipo_mineral.nombre }}</h3>
            @if (grupo.otro_mineral) {
              <app-insignia-estado texto="Otro mineral" tono="aviso" />
            }
            <span class="texto-secundario" data-prueba="resumen-mineral">
              {{ grupo.cantidad }} {{ grupo.cantidad === 1 ? 'ingreso' : 'ingresos' }} ·
              {{ grupo.toneladas | toneladas }}
            </span>
            @if (editable()) {
              <button
                mat-button
                type="button"
                class="grupo__quitar"
                data-prueba="quitar-mineral"
                [attr.aria-label]="'Quitar el mineral ' + grupo.tipo_mineral.nombre"
                (click)="quitarMineral.emit(grupo)"
              >
                <mat-icon>remove_circle_outline</mat-icon>
                Quitar mineral
              </button>
            }
          </div>
          @if (grupo.autorizacion) {
            <p class="texto-secundario" data-prueba="autorizacion">Autorización: {{ grupo.autorizacion }}</p>
          }
          @if (grupo.ingresos.length === 0) {
            <p class="texto-secundario" data-prueba="grupo-vacio">Sin ingresos todavía</p>
          } @else {
            <ul class="ingresos">
              @for (ingreso of grupo.ingresos; track ingreso.id) {
                <li class="ingreso" data-prueba="ingreso">
                  <span class="monoespaciado" data-prueba="codigo">{{ ingreso.codigo }}</span>
                  <span class="texto-secundario">{{ ingreso.fecha_hora_pesaje | fechaLima }}</span>
                  <span class="monoespaciado">{{ ingreso.peso_neto_tn | toneladas }}</span>
                  @if (ingreso.secado_propio) {
                    <app-insignia-estado texto="Tardío · secado propio" tono="aviso" />
                  } @else if (ingreso.tardio) {
                    <app-insignia-estado texto="Tardío" tono="aviso" />
                  }
                  @if (editable()) {
                    <button
                      mat-button
                      type="button"
                      data-prueba="retirar"
                      [attr.aria-label]="'Retirar el ingreso ' + ingreso.codigo"
                      (click)="retirar.emit(ingreso)"
                    >
                      Retirar
                    </button>
                  }
                </li>
              }
            </ul>
          }
        </div>
      }
      <p class="total" data-prueba="total">
        <strong>Total:</strong> {{ total().ingresos }}
        {{ total().ingresos === 1 ? 'ingreso registrado' : 'ingresos registrados' }} ·
        <span class="monoespaciado">{{ total().toneladas | toneladas }}</span>
      </p>
    </section>
  `,
  styles: `
    .titulo {
      margin: 0 0 12px;
      font-size: 1.1rem;
    }
    .grupo {
      padding: 8px 0 12px;
      border-bottom: 1px solid var(--sep);
    }
    .grupo__cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 12px;
    }
    .grupo__nombre {
      margin: 0;
      font-size: 1rem;
    }
    .grupo__quitar {
      margin-left: auto;
    }
    .ingresos {
      display: grid;
      gap: 4px;
      margin: 8px 0 0;
      padding: 0;
      list-style: none;
    }
    .ingreso {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 12px;
    }
    .total {
      margin: 12px 0 0;
    }
  `,
})
export class ComposicionLoteComponent {
  readonly composicion = input.required<readonly ComposicionMineral[]>();
  readonly total = input.required<Lote['total']>();
  /** Gestión de un lote no cerrado: ofrece retirar y quitar. */
  readonly editable = input(false);

  readonly retirar = output<IngresoDeComposicion>();
  readonly quitarMineral = output<ComposicionMineral>();
}
