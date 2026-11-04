import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ETIQUETA_DESTINO } from '@models/lote.model';
import { TrazabilidadIngreso } from '@models/trazabilidad.model';
import { EstadoVacioComponent } from '@shared/components/estado-vacio/estado-vacio.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { RecorridoEtapasComponent } from '@shared/components/recorrido-etapas/recorrido-etapas.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { presentarEstadoLote } from '@shared/utils/presentacion-lote';

/**
 * Trazabilidad del ingreso (HU-M06-03, HU-M07-01 CA10 y CA11): su lote, las etapas de su ruta con
 * fecha y responsable, «x de y etapas», el proceso completo y, si el lote se cerró, su destino
 * y la fecha. Sin lote, el mensaje que manda el servidor («espera en cancha»). Con la ruta por
 * decidir no se muestra proporción (CA07). Presentacional.
 */
@Component({
  selector: 'app-pestana-trazabilidad',
  standalone: true,
  imports: [
    MatIconModule,
    RouterLink,
    EstadoVacioComponent,
    FechaLimaPipe,
    InsigniaEstadoComponent,
    RecorridoEtapasComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta">
      @if (trazabilidad().lote === null) {
        <app-estado-vacio icono="account_tree" [mensaje]="trazabilidad().mensaje ?? sinLote" />
      } @else {
        @if (trazabilidad().lote; as lote) {
          @if (trazabilidad().anulado) {
            <p class="anulado" data-prueba="anulado">
              <app-insignia-estado texto="Ingreso anulado" tono="error" />
              Su recorrido queda como referencia.
            </p>
          }

          <dl class="datos">
            <dt>Lote</dt>
            <dd data-prueba="lote">
              <a [routerLink]="['/lotes', lote.id]">{{ lote.nombre }}</a>
              <span class="texto-secundario monoespaciado"> {{ lote.codigo }}</span>
              <app-insignia-estado [texto]="estadoLote().texto" [tono]="estadoLote().tono" />
            </dd>

            <dt>Avance</dt>
            <dd data-prueba="avance">
              @if (trazabilidad().proceso_completo) {
                <app-insignia-estado texto="Proceso completo" tono="exito" />
              }
              @if (trazabilidad().etapas_totales !== null) {
                <span data-prueba="proporcion">
                  {{ trazabilidad().etapas_recorridas }} de {{ trazabilidad().etapas_totales }} etapas
                </span>
              } @else {
                <span data-prueba="ruta-por-decidir">
                  Ruta por decidir · {{ trazabilidad().etapas_recorridas }}
                  {{ trazabilidad().etapas_recorridas === 1 ? 'etapa recorrida' : 'etapas recorridas' }}
                </span>
              }
            </dd>

            @if (mostrarSecado()) {
              <dt>Secado</dt>
              <dd data-prueba="secado">
                @if (trazabilidad().secado?.propio) {
                  <app-insignia-estado texto="Secado propio" tono="aviso" />
                }
                @if (trazabilidad().secado?.completado) {
                  {{ trazabilidad().secado?.fecha_hora | fechaLima }} · {{ trazabilidad().secado?.usuario }}
                } @else {
                  Pendiente
                }
              </dd>
            }

            @if (lote.estado === 'CERRADO') {
              <dt>Destino</dt>
              <dd data-prueba="destino">{{ destino() }}</dd>
              <dt>Cierre</dt>
              <dd data-prueba="cierre">{{ lote.fecha_cierre | fechaLima }}</dd>
            }
          </dl>

          <app-recorrido-etapas [lineas]="trazabilidad().lineas" />
        }
      }
    </section>
  `,
  styles: `
    .anulado {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
    }
    .datos {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 6px 16px;
      margin: 0 0 16px;
    }
    .datos dt {
      color: var(--label-3);
    }
    .datos dd {
      margin: 0;
    }
  `,
})
export class PestanaTrazabilidadComponent {
  readonly trazabilidad = input.required<TrazabilidadIngreso>();

  protected readonly sinLote = 'El ingreso aún no tiene lote';

  protected readonly estadoLote = computed(() =>
    presentarEstadoLote(this.trazabilidad().lote?.estado ?? 'ABIERTO'),
  );

  protected readonly destino = computed(() => {
    const destino = this.trazabilidad().lote?.destino;
    return destino ? ETIQUETA_DESTINO[destino] : '—';
  });

  /** El secado ya figura entre las etapas de una línea sin partes; solo se muestra aparte si no. */
  protected readonly mostrarSecado = computed(() => {
    const t = this.trazabilidad();
    return t.secado !== undefined && !t.lineas.some((l) => l.etapas.some((e) => e.codigo === 'SECADO'));
  });
}
