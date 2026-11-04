import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { ETIQUETA_OPERACION, Evento } from '@models/evento.model';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { textoRegistro, tonoDeAccion } from '@shared/utils/presentacion-evento';

/**
 * Eventos del más reciente al más antiguo, con su entidad, su referencia y su autor
 * (HU-M09-03 CA01). Presentacional: el orden es el del servidor.
 */
@Component({
  selector: 'app-tabla-eventos',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, FechaLimaPipe, InsigniaEstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-eventos.component.html',
  styles: `
    :host {
      display: block;
      overflow-x: auto;
    }
    .operacion {
      display: block;
      margin-top: 2px;
      font-size: 0.8rem;
    }
  `,
})
export class TablaEventosComponent {
  readonly eventos = input.required<readonly Evento[]>();
  readonly ver = output<Evento>();

  protected readonly columnas = ['fecha', 'usuario', 'accion', 'registro', 'detalle'];

  protected tono(evento: Evento) {
    return tonoDeAccion(evento.accion);
  }

  protected operacion(evento: Evento): string | null {
    return evento.operacion ? ETIQUETA_OPERACION[evento.operacion] : null;
  }

  protected registro(evento: Evento): string {
    return textoRegistro(evento);
  }
}
