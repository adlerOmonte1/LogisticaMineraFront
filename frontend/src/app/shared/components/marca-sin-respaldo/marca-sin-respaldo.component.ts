import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { InsigniaEstadoComponent } from '../insignia-estado/insignia-estado.component';

/**
 * «Sin respaldo fotográfico»: se distingue en toda lista y en el detalle, con su motivo
 * (HU-M03-01 CA17, RNF-M03-16).
 */
@Component({
  selector: 'app-marca-sin-respaldo',
  standalone: true,
  imports: [InsigniaEstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-insignia-estado
    texto="Sin respaldo fotográfico"
    tono="info"
    icono="no_photography"
    [attr.title]="motivo()"
  />`,
})
export class MarcaSinRespaldoComponent {
  readonly motivo = input<string | null>(null);
}
