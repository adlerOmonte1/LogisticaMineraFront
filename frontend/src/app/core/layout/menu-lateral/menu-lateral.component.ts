import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { GrupoNavegacion, ItemNavegacion } from '../navegacion';

/** Barra lateral oscura con las secciones del menú del rol (presentacional). */
@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.scss',
})
export class MenuLateralComponent {
  readonly grupos = input.required<GrupoNavegacion[]>();
  readonly accionPrincipal = input<ItemNavegacion | null>(null);
  readonly navego = output<void>();
}
