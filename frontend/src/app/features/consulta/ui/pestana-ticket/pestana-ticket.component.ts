import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { RespaldoTicket } from '@models/detalle-ingreso.model';
import { EstadoVisor, VisorImagenComponent } from '@shared/components/visor-imagen/visor-imagen.component';

/**
 * El respaldo del ingreso, en uno de sus tres estados (RN-M07-04): la imagen, el motivo por el
 * que no hay foto, o el aviso de que el respaldo no se puede recuperar. Que falle el almacén no
 * impide ver los datos (RNF-M07-09).
 */
@Component({
  selector: 'app-pestana-ticket',
  standalone: true,
  imports: [MatIconModule, VisorImagenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta">
      @switch (respaldo().tipo) {
        @case ('IMAGEN') {
          <app-visor-imagen [src]="urlImagen()" [estado]="estadoImagen()" alt="Ticket de balanza" />
        }
        @case ('SIN_RESPALDO_FOTOGRAFICO') {
          <div class="aviso" data-prueba="sin-respaldo">
            <mat-icon aria-hidden="true">no_photography</mat-icon>
            <p><strong>Sin respaldo fotográfico</strong></p>
            <p>Motivo: {{ respaldo().motivo }}</p>
          </div>
        }
        @default {
          <div class="aviso" data-prueba="no-disponible">
            <mat-icon aria-hidden="true">broken_image</mat-icon>
            <p>{{ respaldo().mensaje }}</p>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .aviso {
      display: grid;
      justify-items: center;
      gap: 4px;
      padding: 32px 16px;
      text-align: center;
    }
    .aviso p {
      margin: 0;
    }
    .aviso mat-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--label-3);
    }
  `,
})
export class PestanaTicketComponent {
  readonly respaldo = input.required<RespaldoTicket>();
  /** `blob:` de la imagen ya descargada con la sesión (D-F14); `null` mientras no llega. */
  readonly urlImagen = input<string | null>(null);
  readonly falloImagen = input(false);

  protected readonly estadoImagen = computed<EstadoVisor>(() => {
    if (this.falloImagen()) {
      return 'error';
    }
    return this.urlImagen() ? 'listo' : 'cargando';
  });
}
