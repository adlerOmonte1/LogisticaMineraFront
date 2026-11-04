import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { LineaTrazabilidad } from '@models/trazabilidad.model';
import { FechaLimaPipe } from '../../pipes/fecha-lima.pipe';

/**
 * Las etapas de la ruta de un ingreso, hechas y por hacer, con su fecha y su responsable
 * (HU-M06-03 CA01, CA06). Una línea por parte cuando el lote se dividió. Cada etapa dice si
 * está completada **con texto**, no solo con el icono ni el color. Presentacional.
 */
@Component({
  selector: 'app-recorrido-etapas',
  standalone: true,
  imports: [MatIconModule, FechaLimaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (linea of lineas(); track $index) {
      <div class="linea" data-prueba="linea">
        <h3 class="linea__nombre" data-prueba="linea-nombre">{{ linea.nombre }}</h3>
        @if (linea.etapas.length === 0) {
          <p class="texto-secundario" data-prueba="ruta-por-decidir">Ruta por decidir</p>
        } @else {
          <ol class="etapas">
            @for (etapa of linea.etapas; track etapa.codigo) {
              <li
                class="etapa"
                [class.etapa--hecha]="etapa.completada"
                data-prueba="etapa"
                [attr.data-completada]="etapa.completada"
              >
                <mat-icon aria-hidden="true">{{
                  etapa.completada ? 'check_circle' : 'radio_button_unchecked'
                }}</mat-icon>
                <strong data-prueba="etapa-nombre">{{ etapa.nombre }}</strong>
                @if (etapa.completada) {
                  <span data-prueba="etapa-estado">Completada</span>
                  <span class="texto-secundario monoespaciado" data-prueba="etapa-fecha">
                    {{ etapa.fecha_hora | fechaLima }}
                  </span>
                  <span class="texto-secundario" data-prueba="etapa-usuario">{{ etapa.usuario }}</span>
                } @else {
                  <span class="texto-secundario" data-prueba="etapa-estado">Pendiente</span>
                }
              </li>
            }
          </ol>
        }
      </div>
    }
  `,
  styles: `
    .linea + .linea {
      margin-top: 16px;
    }
    .linea__nombre {
      margin: 0 0 6px;
      font-size: 1rem;
    }
    .etapas {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .etapa {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px 12px;
      color: var(--label-2);
    }
    .etapa--hecha {
      color: var(--label);
    }
    .etapa--hecha mat-icon {
      color: var(--green);
    }
  `,
})
export class RecorridoEtapasComponent {
  readonly lineas = input.required<readonly LineaTrazabilidad[]>();
}
