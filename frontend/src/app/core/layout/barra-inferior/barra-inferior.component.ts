import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ACCION_PRINCIPAL, ItemNavegacion } from '../navegacion';

/** Navegación inferior del teléfono, alcanzable con el pulgar (RNF-M03-07). */
@Component({
  selector: 'app-barra-inferior',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="barra" aria-label="Navegación rápida">
      @for (item of items(); track item.ruta) {
        <a
          class="barra__enlace"
          [class.barra__enlace--principal]="item.ruta === rutaPrincipal"
          [routerLink]="item.ruta"
          routerLinkActive="barra__enlace--activo"
          [routerLinkActiveOptions]="{ exact: item.exacta ?? false }"
          ariaCurrentWhenActive="page"
        >
          <mat-icon aria-hidden="true">{{ item.icono }}</mat-icon>
          <span>{{ item.etiqueta }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    .barra {
      position: sticky;
      bottom: 0;
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding-bottom: env(safe-area-inset-bottom);
    }
    .barra__enlace {
      display: grid;
      justify-items: center;
      gap: 2px;
      min-height: 56px;
      padding: 6px 2px;
      font-size: 0.7rem;
      color: var(--label-2);
      text-decoration: none;
    }
    .barra__enlace--activo {
      color: var(--accent);
      font-weight: 600;
    }
    .barra__enlace--principal mat-icon {
      color: var(--label);
      background: var(--gold);
      border-radius: 999px;
      padding: 4px 14px;
    }
  `,
})
export class BarraInferiorComponent {
  readonly items = input.required<ItemNavegacion[]>();
  protected readonly rutaPrincipal = ACCION_PRINCIPAL.ruta;
}
