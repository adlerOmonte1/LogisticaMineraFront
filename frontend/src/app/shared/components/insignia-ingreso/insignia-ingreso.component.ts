import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ETIQUETA_ESTADO_INGRESO, EstadoIngreso } from '@models/ingreso.model';
import { InsigniaEstadoComponent, TonoInsignia } from '../insignia-estado/insignia-estado.component';

const TONO_POR_ESTADO: Readonly<Record<EstadoIngreso, TonoInsignia>> = {
  REGISTRADO: 'exito',
  EN_PROCESO: 'aviso',
  ANULADO: 'error',
};

/** Estado de un ingreso: Registrado, En proceso o Anulado. */
@Component({
  selector: 'app-insignia-ingreso',
  standalone: true,
  imports: [InsigniaEstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-insignia-estado [texto]="texto()" [tono]="tono()" />`,
})
export class InsigniaIngresoComponent {
  readonly estado = input.required<EstadoIngreso>();

  protected readonly texto = computed(() => ETIQUETA_ESTADO_INGRESO[this.estado()]);
  protected readonly tono = computed(() => TONO_POR_ESTADO[this.estado()]);
}
