import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ETIQUETA_OPERACION, Evento } from '@models/evento.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { tonoDeAccion } from '@shared/utils/presentacion-evento';
import { CambiosEventoComponent } from '../cambios-evento/cambios-evento.component';
import { EstadoVacioComponent } from '../estado-vacio/estado-vacio.component';
import { InsigniaEstadoComponent } from '../insignia-estado/insignia-estado.component';

/**
 * Los eventos de un ingreso en el orden que manda el servidor —cronológico, del primero al más
 * reciente—, con su autor, la acción en el texto del servidor, la operación que la distingue
 * (corrección, reversión, destare, paso del lote), el motivo y, por campo, el antes y el
 * después (HU-M09-02 CA01 a CA03). Presentacional: no pide nada ni ordena.
 */
@Component({
  selector: 'app-linea-eventos',
  standalone: true,
  imports: [FechaLimaPipe, CambiosEventoComponent, EstadoVacioComponent, InsigniaEstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (eventos().length === 0) {
      <app-estado-vacio icono="history" [mensaje]="mensajeVacio()" />
    } @else {
      <ol class="linea" aria-label="Eventos en orden cronológico">
        @for (evento of eventos(); track evento.id) {
          <li class="evento" data-prueba="evento">
            <div class="evento__cabecera">
              <time
                class="evento__fecha monoespaciado"
                [attr.datetime]="evento.fecha_hora"
                data-prueba="fecha"
              >
                {{ evento.fecha_hora | fechaLima }}
              </time>
              <app-insignia-estado [texto]="evento.accion_texto" [tono]="tono(evento)" />
              @if (operacion(evento); as texto) {
                <span class="evento__operacion" data-prueba="operacion">{{ texto }}</span>
              }
              <span class="evento__autor texto-secundario" data-prueba="autor">
                {{ evento.usuario ?? 'Sin sesión' }}
              </span>
            </div>
            @if (evento.motivo) {
              <p class="evento__motivo" data-prueba="motivo">
                <span class="texto-secundario">Motivo:</span> {{ evento.motivo }}
              </p>
            }
            <app-cambios-evento [cambios]="evento.cambios" />
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .linea {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .evento {
      display: grid;
      gap: 8px;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
    }
    .evento__cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 12px;
    }
    .evento__operacion {
      font-weight: 600;
    }
    .evento__autor::before {
      content: 'por ';
    }
    .evento__motivo {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
})
export class LineaEventosComponent {
  readonly eventos = input.required<readonly Evento[]>();
  readonly mensajeVacio = input('No hay eventos para mostrar');

  protected tono(evento: Evento) {
    return tonoDeAccion(evento.accion);
  }

  protected operacion(evento: Evento): string | null {
    return evento.operacion ? ETIQUETA_OPERACION[evento.operacion] : null;
  }
}
