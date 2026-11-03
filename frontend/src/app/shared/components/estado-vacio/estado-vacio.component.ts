import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Lista sin resultados. El mensaje, cuando lo hay, es el que manda el servidor. */
@Component({
  selector: 'app-estado-vacio',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vacio" role="status">
      <mat-icon class="vacio__icono" aria-hidden="true">{{ icono() }}</mat-icon>
      <p class="vacio__mensaje">{{ mensaje() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    .vacio {
      display: grid;
      justify-items: center;
      gap: 8px;
      padding: 40px 16px;
      text-align: center;
      color: var(--label-2);
    }
    .vacio__icono {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--label-3);
    }
    .vacio__mensaje {
      margin: 0;
      font-weight: 500;
    }
  `,
})
export class EstadoVacioComponent {
  readonly mensaje = input.required<string>();
  readonly icono = input('inbox');
}
