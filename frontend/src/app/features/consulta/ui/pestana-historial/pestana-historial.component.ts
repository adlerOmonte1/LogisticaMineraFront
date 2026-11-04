import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { SiPuedeDirective } from '@core/autorizacion/si-puede.directive';
import { Evento } from '@models/evento.model';
import { LineaEventosComponent } from '@shared/components/linea-eventos/linea-eventos.component';

/**
 * Historial del ingreso (HU-M09-02, HU-M07-02 CA12): lo ven los tres roles igual (CA04). El
 * enlace a la auditoría completa lo ve solo quien puede consultarla (CA05) y la abre ya
 * filtrada por el código del ingreso. El servidor rechaza la auditoría a los demás.
 */
@Component({
  selector: 'app-pestana-historial',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, SiPuedeDirective, LineaEventosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta">
      <div class="acciones" *appSiPuede="'CONSULTAR_AUDITORIA'">
        <a
          mat-stroked-button
          routerLink="/administracion/auditoria"
          [queryParams]="{ texto: codigo() }"
          data-prueba="enlace-auditoria"
        >
          <mat-icon>manage_search</mat-icon>
          Ver en la auditoría del sistema
        </a>
      </div>
      <app-linea-eventos [eventos]="eventos()" />
    </section>
  `,
  styles: `
    .acciones {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 12px;
    }
  `,
})
export class PestanaHistorialComponent {
  readonly eventos = input.required<readonly Evento[]>();
  /** Código del ingreso: filtra la auditoría completa. */
  readonly codigo = input.required<string>();
}
