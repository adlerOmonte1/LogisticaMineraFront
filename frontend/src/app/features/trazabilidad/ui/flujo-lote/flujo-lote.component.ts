import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { CatalogoRecorrido, Lote, SiguientePaso } from '@models/lote.model';
import { FichaComponent } from '@shared/components/ficha/ficha.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { TarjetaEtapaComponent } from '../tarjeta-etapa/tarjeta-etapa.component';
import { construirFlujo } from './flujo-lote';

/**
 * «Recorrido del mineral», como en la maqueta: la etapa común (secado de todo el lote), la
 * división y una columna por parte con una tarjeta por etapa, y los ingresos agregados después
 * del secado con su secado propio. El botón de cada tarjeta es un `siguientes` del servidor
 * (RNF-M06-07); registrar sigue siendo dos o tres toques (RNF-M06-06). Los bigbags se muestran
 * como estimación (RNF-M06-09). Presentacional (D-F45).
 */
@Component({
  selector: 'app-flujo-lote',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    FichaComponent,
    FechaLimaPipe,
    ToneladasPipe,
    TarjetaEtapaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (flujo(); as flujo) {
      <div class="flujo" data-prueba="flujo">
        <div>
          <div class="flujo__cabeza">
            <h3>Etapa común</h3>
            <span class="nota">Todo el lote se seca junto</span>
          </div>
          <div class="etapas">
            <app-tarjeta-etapa
              [tarjeta]="flujo.secado"
              [puedeRegistrar]="puedeRegistrar()"
              (registrar)="registrar.emit($event)"
            />
          </div>
        </div>

        <div class="division">
          @if (flujo.dividido) {
            <app-ficha color="purple" data-prueba="dividido"
              >Dividido en {{ flujo.lineas.length }} partes</app-ficha
            >
          } @else {
            <span class="nota">Después del secado</span>
          }
        </div>

        <div
          class="lineas"
          [class.lineas--dos]="flujo.lineas.length === 2"
          [class.lineas--varias]="flujo.lineas.length > 2"
        >
          @for (linea of flujo.lineas; track linea.clave) {
            <section class="linea" data-prueba="linea">
              <div class="linea__cabeza">
                <div>
                  <h3 data-prueba="linea-nombre">{{ linea.nombre }}</h3>
                  <p class="nota" data-prueba="linea-detalle">{{ linea.detalle }}</p>
                </div>
                @if (linea.completa) {
                  <app-ficha color="green" [punto]="true">Ensacado</app-ficha>
                }
              </div>
              @if (linea.etapas; as etapas) {
                <div class="etapas" [class.etapas--columnas]="etapas.length > 1 && flujo.lineas.length === 1">
                  @for (etapa of etapas; track etapa.etapa) {
                    <app-tarjeta-etapa
                      [tarjeta]="etapa"
                      [puedeRegistrar]="puedeRegistrar()"
                      (registrar)="registrar.emit($event)"
                    />
                  }
                </div>
              } @else {
                <div
                  class="por-definir"
                  [class.por-definir--siguiente]="linea.elegirRuta !== null"
                  data-prueba="ruta-por-definir"
                >
                  <h3>Ruta por definir</h3>
                  <p class="nota">
                    @if (linea.elegirRuta) {
                      Elija si este mineral se zarandea, se muele directo o pasa por ambos antes del ensacado.
                    } @else {
                      Se decide al terminar el secado.
                    }
                  </p>
                  @if (linea.elegirRuta && puedeRegistrar()) {
                    <button
                      mat-flat-button
                      color="primary"
                      type="button"
                      data-prueba="siguiente"
                      (click)="registrar.emit(linea.elegirRuta)"
                    >
                      Registrar siguiente paso
                    </button>
                  }
                </div>
              }
              @if (linea.ensacada) {
                <div class="ensacado">
                  @if (linea.bigbags; as bigbags) {
                    <span class="ensacado__resumen" data-prueba="resumen-bigbags">
                      <mat-icon>inventory_2</mat-icon>
                      <span>
                        <b>{{ bigbags.cantidad }} {{ bigbags.cantidad === 1 ? 'bigbag' : 'bigbags' }}</b
                        >, ≈ {{ bigbags.aproximadoTn | toneladas }} ensacadas
                        <span class="nota">(estimación)</span>
                      </span>
                    </span>
                  } @else {
                    <span class="nota">Sin bigbags registrados</span>
                  }
                  @if (puedeAsociar()) {
                    <button
                      mat-stroked-button
                      type="button"
                      data-prueba="asociar-bigbags"
                      (click)="asociarBigbags.emit()"
                    >
                      <mat-icon>add</mat-icon>
                      Asociar bigbags
                    </button>
                  }
                </div>
              }
            </section>
          }
        </div>

        @if (flujo.complementos.length > 0) {
          <div class="division">
            <app-ficha color="orange">Ingresos agregados después del secado</app-ficha>
          </div>
          @for (comp of flujo.complementos; track comp.ingreso.id) {
            <section class="linea linea--tardio" data-prueba="complemento">
              <div class="linea__cabeza">
                <div>
                  <h3>{{ comp.ingreso.codigo }}</h3>
                  <p class="nota">
                    {{ comp.ingreso.fecha_hora_pesaje | fechaLima }},
                    {{ comp.ingreso.peso_neto_tn | toneladas }}
                  </p>
                </div>
                @if (comp.secado.paso) {
                  <app-ficha color="green" [punto]="true">Secado propio hecho</app-ficha>
                } @else {
                  <app-ficha color="orange">Secado pendiente</app-ficha>
                }
              </div>
              <app-tarjeta-etapa
                [tarjeta]="comp.secado"
                [puedeRegistrar]="puedeRegistrar()"
                (registrar)="registrar.emit($event)"
              />
              @for (paso of comp.pasos; track paso.id) {
                @if (paso.etapa !== 'SECADO') {
                  <p class="nota" data-prueba="paso-complemento">
                    {{ paso.etapa_texto }} · {{ paso.carga }} · {{ paso.fecha_hora | fechaLima }}
                  </p>
                }
              }
              @if (puedeRegistrar()) {
                @for (siguiente of comp.otros; track $index) {
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    data-prueba="siguiente"
                    (click)="registrar.emit(siguiente)"
                  >
                    {{ textoSiguiente(siguiente) }} · {{ siguiente.carga }}
                  </button>
                }
              }
            </section>
          }
        }

        @if (flujo.sueltos.length > 0 && puedeRegistrar()) {
          <section class="linea linea--sueltos" data-prueba="otros-pasos">
            <h3>Otros pasos pendientes</h3>
            @for (siguiente of flujo.sueltos; track $index) {
              <button
                mat-flat-button
                color="primary"
                type="button"
                data-prueba="siguiente"
                (click)="registrar.emit(siguiente)"
              >
                {{ textoSiguiente(siguiente) }} · {{ siguiente.carga }}
              </button>
            }
          </section>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }
    p {
      margin: 0;
    }
    .nota {
      font-size: 12px;
      color: var(--label-2);
    }
    .flujo {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .flujo__cabeza {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 8px;
    }
    .division {
      display: flex;
      align-items: center;
      gap: 10px;
      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 2px;
        background: var(--border);
      }
    }
    .lineas {
      display: grid;
      gap: 14px;
    }
    .lineas--dos {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .lineas--varias {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
    .linea {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
      min-width: 0;
      padding: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: 3px solid var(--purple-b);
      border-radius: 6px;
      button {
        align-self: flex-start;
      }
    }
    .linea--tardio {
      border-top-color: var(--orange-b);
    }
    .linea--sueltos {
      border-top-color: var(--gold);
    }
    .linea__cabeza {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .etapas {
      display: grid;
      gap: 12px;
      grid-template-columns: minmax(0, 1fr);
    }
    .etapas--columnas {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
    .por-definir {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .por-definir--siguiente {
      border: 1px solid var(--gold);
      border-top: 3px solid var(--gold);
      background: color-mix(in srgb, var(--gold) 5%, var(--surface));
    }
    .ensacado {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
    }
    .ensacado__resumen {
      display: flex;
      align-items: center;
      gap: 6px;
      .mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
    }
    @media (max-width: 1100px) {
      .lineas--dos {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    @media (max-width: 767px) {
      .linea {
        padding: 16px;
      }
    }
  `,
})
export class FlujoLoteComponent {
  readonly lote = input.required<Lote>();
  readonly catalogo = input<CatalogoRecorrido | null>(null);
  /** Registrar etapas: todos los roles, con el lote sin cerrar (HU-M06-02). */
  readonly puedeRegistrar = input(false);
  /** Hay ensacado y el usuario puede registrar (HU-M06-02 CA13). */
  readonly puedeAsociar = input(false);

  readonly registrar = output<SiguientePaso>();
  readonly asociarBigbags = output<void>();

  protected readonly flujo = computed(() => construirFlujo(this.lote(), this.catalogo()));

  protected textoSiguiente(siguiente: SiguientePaso): string {
    if (siguiente.elegir_ruta) {
      return 'Elegir la ruta';
    }
    const nombre = this.catalogo()?.etapas.find((e) => e.codigo === siguiente.etapa)?.nombre;
    return `Registrar ${(nombre ?? siguiente.etapa ?? '').toLowerCase()}`;
  }
}
