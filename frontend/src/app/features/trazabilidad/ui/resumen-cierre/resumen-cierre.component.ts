import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { CodigoEtapa, Lote, ResumenLote } from '@models/lote.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { FichaComponent } from '@shared/components/ficha/ficha.component';

const COLOR_ETAPA: Readonly<Record<CodigoEtapa, string>> = {
  SECADO: 'var(--accent)',
  ZARANDEO: 'var(--accent)',
  MOLIENDA: 'var(--purple-b)',
  ENSACADO: 'var(--green)',
};

/**
 * Resumen de un lote antes y después del cierre, como `pAlta` de la maqueta: cuatro cifras
 * (registrado, ensacado, diferencia y duración), los tiempos, el resultado por parte, el
 * recorrido en línea de tiempo y los ingresos. Lo ensacado y la diferencia son estimaciones
 * (HU-M06-05 CA06, RNF-M06-09); todas las cifras son las del servidor. Presentacional.
 */
@Component({
  selector: 'app-resumen-cierre',
  standalone: true,
  imports: [FichaComponent, MatIconModule, RouterLink, FechaLimaPipe, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lm-pila">
      <div class="lm-grid lm-g4">
        <div class="lm-card kpi">
          <div class="k-top">
            <span>Toneladas registradas</span><mat-icon class="lm-tone-blue">scale</mat-icon>
          </div>
          <div class="k-val lm-num" data-prueba="registradas">
            {{ resumen().toneladas_registradas | toneladas: false }}<small>t</small>
          </div>
          <div class="k-sub">
            Suma de {{ registrados() }} {{ registrados() === 1 ? 'ingreso' : 'ingresos' }}
          </div>
        </div>
        <div class="lm-card kpi">
          <div class="k-top">
            <span>Ensacado aproximado</span><mat-icon class="lm-tone-green">inventory_2</mat-icon>
          </div>
          <div class="k-val lm-num" data-prueba="ensacado">
            @if (resumen().bigbags > 0) {
              ≈ {{ resumen().ensacado_aproximado_tn | toneladas: false }}<small>t</small>
            } @else {
              —
            }
          </div>
          <div class="k-sub" data-prueba="bigbags">
            {{ resumen().bigbags }} {{ resumen().bigbags === 1 ? 'bigbag' : 'bigbags' }} · estimación
          </div>
        </div>
        <div class="lm-card kpi">
          <div class="k-top">
            <span>Diferencia</span
            ><mat-icon [class]="supera() ? 'lm-tone-orange' : 'lm-faint'">warning</mat-icon>
          </div>
          <div class="k-val lm-num" data-prueba="diferencia">
            @if (resumen().bigbags > 0) {
              ≈ {{ supera() ? '+' : '' }}{{ resumen().diferencia_tn | toneladas: false }}<small>t</small>
            } @else {
              —
            }
          </div>
          <div class="k-sub">
            @if (resumen().bigbags === 0) {
              Sin bigbags registrados
            } @else if (supera()) {
              Supera lo registrado · estimación
            } @else {
              Merma frente a lo registrado · estimación
            }
          </div>
        </div>
        <div class="lm-card kpi">
          <div class="k-top">
            <span>Duración del proceso</span><mat-icon class="lm-tone-purple">schedule</mat-icon>
          </div>
          <div class="k-val lm-num" data-prueba="horas-inicio">
            {{ duracion(resumen().horas_desde_inicio) }}
          </div>
          <div class="k-sub">Desde el inicio del recorrido</div>
        </div>
      </div>

      <div class="lm-card">
        <h2 class="lm-seccion sin-margen">Tiempos</h2>
        <div class="lm-grid lm-g4">
          <div class="lm-kv">
            <span>Apertura</span><b>{{ lote().fecha_apertura | fechaLima: 'fecha' }}</b>
          </div>
          <div class="lm-kv">
            <span>Inicio del recorrido</span><b>{{ lote().fecha_inicio_recorrido | fechaLima }}</b>
          </div>
          <div class="lm-kv">
            <span>Secado del lote</span><b>{{ secado()?.fecha_hora | fechaLima }}</b>
          </div>
          <div class="lm-kv">
            <span>Último ensacado</span><b>{{ resumen().ultimo_ensacado | fechaLima }}</b>
          </div>
          <div class="lm-kv">
            <span>Desde la apertura</span
            ><b data-prueba="horas-apertura">{{ duracion(resumen().horas_desde_apertura) }}</b>
          </div>
          <div class="lm-kv">
            <span>Cierre del lote</span>
            <b>
              @if (lote().fecha_cierre) {
                {{ lote().fecha_cierre | fechaLima }}
              } @else {
                Pendiente
              }
            </b>
          </div>
          <div class="lm-kv">
            <span>Destino</span><b>{{ lote().destino_texto || '—' }}</b>
          </div>
          <div class="lm-kv">
            <span>Responsable del cierre</span><b>{{ lote().usuario_cierre ?? '—' }}</b>
          </div>
        </div>
      </div>

      @if (resumen().partes.length > 0) {
        <h2 class="lm-seccion">Resultado por parte</h2>
        <div class="lm-card lm-card--plana">
          <div class="lm-scroll">
            <table class="lm-tabla">
              <thead>
                <tr>
                  <th>Parte</th>
                  <th>Fracción</th>
                  <th class="r">Registrado aprox.</th>
                  <th>Molienda</th>
                </tr>
              </thead>
              <tbody>
                @for (parte of resumen().partes; track parte.nombre) {
                  <tr>
                    <td class="main" data-l="" data-prueba="parte">{{ parte.nombre }}</td>
                    <td data-l="Fracción">{{ parte.fraccion }}</td>
                    <td class="r" data-l="Registrado">≈ {{ parte.toneladas_aproximadas | toneladas }}</td>
                    <td data-l="Molienda" data-prueba="rendimiento">
                      @if (parte.toneladas_por_hora) {
                        {{ horas(parte.horas_molienda) }} h · {{ parte.toneladas_por_hora }} t/h
                      } @else {
                        No aplica
                      }
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td data-l="">Total del lote</td>
                  <td data-l=""></td>
                  <td class="r" data-l="Registrado">{{ resumen().toneladas_registradas | toneladas }}</td>
                  <td data-l=""></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }

      <h2 class="lm-seccion">Recorrido del mineral</h2>
      <div class="lm-card">
        @if (lote().recorrido.length === 0) {
          <p class="lm-small lm-muted sin-margen" data-prueba="sin-pasos">Aún no se registran etapas.</p>
        } @else {
          <div class="tl">
            @for (paso of lote().recorrido; track paso.id) {
              <div class="tl-i" data-prueba="paso">
                <span class="dot" [style.background]="color(paso.etapa)"></span>
                <div class="t-b">
                  <b>{{ paso.etapa_texto }} · {{ paso.carga }}</b>
                  <small>
                    {{ paso.usuario }}
                    @if (paso.horas_molienda) {
                      · {{ horas(paso.horas_molienda) }} h de molino
                    }
                    @if (paso.observacion) {
                      · {{ paso.observacion }}
                    }
                  </small>
                </div>
                <time>{{ paso.fecha_hora | fechaLima }}</time>
              </div>
            }
          </div>
        }
      </div>

      <h2 class="lm-seccion">Ingresos del lote</h2>
      <div class="lm-card lm-card--plana">
        <div class="lm-scroll">
          <table class="lm-tabla">
            <thead>
              <tr>
                <th>Ingreso</th>
                <th>Pesaje</th>
                <th class="r">Peso neto</th>
              </tr>
            </thead>
            <tbody>
              @for (ingreso of ingresos(); track ingreso.id) {
                <tr [class.dim]="ingreso.estado === 'ANULADO'">
                  <td class="main" data-l="Ingreso">
                    <a [routerLink]="['/consulta/ingresos', ingreso.id]">{{ ingreso.codigo }}</a>
                    @if (ingreso.tardio) {
                      <app-ficha color="orange">Tardío</app-ficha>
                    }
                  </td>
                  <td class="lm-num" data-l="Pesaje">{{ ingreso.fecha_hora_pesaje | fechaLima }}</td>
                  <td class="r" data-l="Neto">{{ ingreso.peso_neto_tn | toneladas }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: `
    .sin-margen {
      margin: 0;
    }
    app-ficha {
      margin-left: 6px;
    }
    .kpi {
      gap: 6px;
    }
    .k-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--label-2);
      .mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }
    }
    .k-val {
      font: 700 34px/1.05 var(--font-d);
      small {
        margin-left: 5px;
        font: 500 15px var(--font);
        color: var(--label-2);
      }
    }
    .k-sub {
      font-size: 12.5px;
      color: var(--label-3);
    }
    .tl {
      display: flex;
      flex-direction: column;
    }
    .tl-i {
      display: flex;
      gap: 14px;
      padding: 12px 0;
      & + & {
        border-top: 1px solid var(--sep);
      }
    }
    .dot {
      flex: none;
      width: 9px;
      height: 9px;
      margin-top: 6px;
      border-radius: 1px;
    }
    .t-b {
      flex: 1;
      min-width: 0;
      b {
        display: block;
        font-size: 14px;
        font-weight: 600;
      }
      small {
        font-size: 12.5px;
        color: var(--label-2);
      }
    }
    time {
      color: var(--label-3);
      font-size: 12.5px;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    @media (max-width: 767px) {
      .k-val {
        font-size: 28px;
      }
    }
  `,
})
export class ResumenCierreComponent {
  readonly resumen = input.required<ResumenLote>();
  readonly lote = input.required<Lote>();

  protected readonly ingresos = computed(() => this.lote().composicion.flatMap((g) => g.ingresos));
  protected readonly registrados = computed(
    () => this.ingresos().filter((i) => i.estado === 'REGISTRADO').length,
  );
  protected readonly secado = computed(
    () =>
      this.lote().recorrido.find(
        (p) => p.etapa === 'SECADO' && p.parte === null && p.ingreso_tardio === null,
      ) ?? null,
  );
  /** El servidor da la diferencia como ensacado − registrado: positiva, supera lo registrado. */
  protected readonly supera = computed(() => Number(this.resumen().diferencia_tn) > 0);

  protected duracion(horas: number | null): string {
    if (horas === null) {
      return '—';
    }
    const dias = Math.floor(horas / 24);
    const resto = Math.round(horas % 24);
    return dias > 0 ? `${dias} d ${resto} h` : `${resto} h`;
  }

  protected horas(valor: string | null): string {
    return (valor ?? '').replace(/\.00$/, '');
  }

  protected color(etapa: CodigoEtapa): string {
    return COLOR_ETAPA[etapa];
  }
}
