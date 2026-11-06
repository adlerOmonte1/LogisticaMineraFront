import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { FichaComponent } from '../ficha/ficha.component';

/** «Sin respaldo fotográfico» con el motivo al pasar el cursor (RNF-M03-16). */
@Component({
  selector: 'app-marca-sin-respaldo',
  standalone: true,
  imports: [FichaComponent, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-ficha color="gray" [attr.title]="motivo()"
    ><mat-icon class="icono" aria-hidden="true">no_photography</mat-icon>Sin respaldo fotográfico</app-ficha
  >`,
  styles: `
    .icono {
      width: 14px;
      height: 14px;
      font-size: 14px;
    }
  `,
})
export class MarcaSinRespaldoComponent {
  readonly motivo = input<string | null>(null);
}
