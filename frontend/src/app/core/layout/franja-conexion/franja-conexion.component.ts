import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Aviso visible mientras el navegador no tiene red. */
@Component({
  selector: 'app-franja-conexion',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!enLinea()) {
      <div class="franja" role="status">
        <mat-icon aria-hidden="true">wifi_off</mat-icon>
        Sin conexión. Lo que tiene en pantalla se conserva; vuelva a intentar al recuperar la señal.
      </div>
    }
  `,
  styles: `
    .franja {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--orange);
      color: #ffffff;
      font-weight: 500;
    }
  `,
})
export class FranjaConexionComponent {
  readonly enLinea = input.required<boolean>();
}
