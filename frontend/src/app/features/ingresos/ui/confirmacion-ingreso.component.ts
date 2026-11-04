import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { Ingreso } from '@models/ingreso.model';
import { ConMensaje } from '@models/pagina.model';
import { InsigniaIngresoComponent } from '@shared/components/insignia-ingreso/insignia-ingreso.component';

/**
 * Paso 3: el ingreso quedó registrado. El mensaje es el literal del servidor, con el código
 * asignado y, si el vehículo no tenía tara, su estado «En proceso» (HU-M03-01 CA01, CA05).
 */
@Component({
  selector: 'app-confirmacion-ingreso',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, InsigniaIngresoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta confirmacion" role="status">
      <mat-icon class="confirmacion__icono" aria-hidden="true">check_circle</mat-icon>
      <h2 class="confirmacion__mensaje" data-prueba="mensaje">{{ ingreso().mensaje }}</h2>
      <p class="confirmacion__datos">
        <strong class="monoespaciado" data-prueba="codigo">{{ ingreso().codigo }}</strong>
        <app-insignia-ingreso [estado]="ingreso().estado" />
      </p>
      <div class="confirmacion__acciones">
        <a mat-stroked-button [routerLink]="['/consulta/ingresos', ingreso().id]" data-prueba="ver-detalle"
          >Ver detalle</a
        >
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="registrarOtro.emit()"
          data-prueba="registrar-otro"
        >
          <mat-icon>add_a_photo</mat-icon>
          Registrar otro ingreso
        </button>
      </div>
    </section>
  `,
  styles: `
    .confirmacion {
      display: grid;
      justify-items: center;
      gap: 8px;
      max-width: 560px;
      margin: 0 auto;
      padding: 32px 16px;
      text-align: center;
    }
    .confirmacion__icono {
      width: 56px;
      height: 56px;
      font-size: 56px;
      color: var(--green-b);
    }
    .confirmacion__mensaje {
      margin: 0;
      font-size: 1.25rem;
    }
    .confirmacion__datos {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.1rem;
    }
    .confirmacion__acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 12px;
    }
  `,
})
export class ConfirmacionIngresoComponent {
  readonly ingreso = input.required<ConMensaje<Ingreso>>();
  readonly registrarOtro = output<void>();
}
