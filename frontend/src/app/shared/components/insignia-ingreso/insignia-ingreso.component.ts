import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ETIQUETA_ESTADO_INGRESO, EstadoIngreso } from '@models/ingreso.model';
import { ColorFicha } from '@shared/utils/presentacion-lote';
import { FichaComponent } from '../ficha/ficha.component';

const COLOR_POR_ESTADO: Readonly<Record<EstadoIngreso, ColorFicha>> = {
  REGISTRADO: 'green',
  EN_PROCESO: 'orange',
  ANULADO: 'red',
};

/** Estado de un ingreso como ficha de la maqueta: Registrado, En proceso o Anulado. */
@Component({
  selector: 'app-insignia-ingreso',
  standalone: true,
  imports: [FichaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-ficha [color]="color()" [punto]="true">{{ texto() }}</app-ficha>`,
})
export class InsigniaIngresoComponent {
  readonly estado = input.required<EstadoIngreso>();

  protected readonly texto = computed(() => ETIQUETA_ESTADO_INGRESO[this.estado()]);
  protected readonly color = computed(() => COLOR_POR_ESTADO[this.estado()]);
}
