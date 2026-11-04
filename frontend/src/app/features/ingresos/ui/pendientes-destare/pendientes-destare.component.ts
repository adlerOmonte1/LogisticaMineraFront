import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { IngresoPendienteDestare, VehiculoPendiente } from '@models/ingreso.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Los vehículos con ingresos En proceso, cada uno con su código, fecha del pesaje y peso bruto
 * (HU-M03-04 CA06). Se elige el vehículo cuyo destare se va a registrar.
 */
@Component({
  selector: 'app-pendientes-destare',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, FechaLimaPipe, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="vehiculos" role="list">
      @for (vehiculo of vehiculos(); track vehiculo.id) {
        <li class="tarjeta vehiculo" [class.vehiculo--elegido]="vehiculo.id === elegido()">
          <header class="vehiculo__cabecera">
            <div>
              <strong class="monoespaciado vehiculo__placa">{{ vehiculo.placa }}</strong>
              <span class="texto-secundario">
                {{ vehiculo.ingresos }} {{ vehiculo.ingresos === 1 ? 'ingreso' : 'ingresos' }} en proceso
              </span>
            </div>
            <button
              mat-flat-button
              [color]="vehiculo.id === elegido() ? 'accent' : 'primary'"
              type="button"
              (click)="elegir.emit(vehiculo.id)"
              [attr.data-prueba]="'destarar-' + vehiculo.placa"
            >
              <mat-icon>scale</mat-icon>
              {{ vehiculo.id === elegido() ? 'Elegido' : 'Registrar destare' }}
            </button>
          </header>
          <ul class="ingresos" role="list">
            @for (ingreso of ingresosDe(vehiculo.id); track ingreso.id) {
              <li class="ingreso">
                <span class="monoespaciado">{{ ingreso.codigo }}</span>
                <span class="texto-secundario">{{ ingreso.fecha_hora_pesaje | fechaLima }}</span>
                <span class="monoespaciado">Bruto {{ ingreso.peso_bruto_tn | toneladas }}</span>
              </li>
            }
          </ul>
        </li>
      }
    </ul>
  `,
  styleUrl: './pendientes-destare.component.scss',
})
export class PendientesDestareComponent {
  readonly vehiculos = input.required<readonly VehiculoPendiente[]>();
  readonly ingresos = input.required<readonly IngresoPendienteDestare[]>();
  readonly elegido = input<number | null>(null);

  readonly elegir = output<number>();

  protected ingresosDe(vehiculo: number): IngresoPendienteDestare[] {
    return this.ingresos().filter((ingreso) => ingreso.vehiculo === vehiculo);
  }
}
