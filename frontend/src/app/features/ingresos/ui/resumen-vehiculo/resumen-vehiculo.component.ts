import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ConsultaVehiculo } from '@models/registro-ingreso.model';
import { ETIQUETA_TITULARIDAD } from '@models/vehiculo.model';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { calcularNeto } from '@shared/utils/decimal';

export type EstadoVehiculo = 'vacio' | 'consultando' | 'fallo' | 'nuevo' | 'baja' | 'sin-tara' | 'con-tara';

/**
 * Lo que el catálogo dice del vehículo de la placa escrita: titularidad, capacidad, tara y
 * un peso neto de **referencia** (HU-M03-01 CA05, CA08). El neto real lo calcula el servidor.
 */
@Component({
  selector: 'app-resumen-vehiculo',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resumen-vehiculo.component.html',
  styleUrl: './resumen-vehiculo.component.scss',
})
export class ResumenVehiculoComponent {
  readonly placa = input.required<string>();
  readonly pesoBruto = input('');
  readonly consulta = input<ConsultaVehiculo | null>(null);
  /** El aviso literal del servidor para la placa reconocida (HU-M03-01 CA04). */
  readonly avisoServidor = input<string | null>(null);

  readonly registrarVehiculo = output<void>();

  protected readonly etiquetaTitularidad = ETIQUETA_TITULARIDAD;

  protected readonly estado = computed<EstadoVehiculo>(() => {
    const consulta = this.consulta();
    if (!this.placa()) {
      return 'vacio';
    }
    if (!consulta || consulta.placa !== this.placa()) {
      return 'consultando';
    }
    if (consulta.fallo) {
      return 'fallo';
    }
    if (!consulta.vehiculo) {
      return 'nuevo';
    }
    if (!consulta.vehiculo.activo) {
      return 'baja';
    }
    return consulta.vehiculo.tara_tn ? 'con-tara' : 'sin-tara';
  });

  protected readonly vehiculo = computed(() => this.consulta()?.vehiculo ?? null);
  protected readonly netoReferencia = computed(() =>
    calcularNeto(this.pesoBruto(), this.vehiculo()?.tara_tn),
  );
}
