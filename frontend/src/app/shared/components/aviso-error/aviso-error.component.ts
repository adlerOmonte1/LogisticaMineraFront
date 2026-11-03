import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ErrorApi } from '@models/error-api.model';

/** Mensaje general de un rechazo del servidor, literal, sobre el formulario o la lista. */
@Component({
  selector: 'app-aviso-error',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error(); as error) {
      <div class="aviso" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ error.mensaje }}</span>
      </div>
    }
  `,
  styles: `
    .aviso {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      border-radius: 10px;
      color: var(--red);
      background: color-mix(in srgb, var(--red-b) 10%, transparent);
      font-weight: 500;
    }
  `,
})
export class AvisoErrorComponent {
  readonly error = input<ErrorApi | null>(null);
}
