import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface Pestana {
  ruta: string;
  etiqueta: string;
}

/** Pestañas que son rutas hijas: cada pestaña tiene su URL y se puede enlazar directo. */
@Component({
  selector: 'app-pestanas-ruta',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav mat-tab-nav-bar [tabPanel]="panel" [attr.aria-label]="etiqueta()">
      @for (pestana of pestanas(); track pestana.ruta) {
        <a
          mat-tab-link
          [routerLink]="pestana.ruta"
          routerLinkActive
          #activa="routerLinkActive"
          [active]="activa.isActive"
        >
          {{ pestana.etiqueta }}
        </a>
      }
    </nav>
    <mat-tab-nav-panel #panel class="panel">
      <router-outlet />
    </mat-tab-nav-panel>
  `,
  styles: `
    .panel {
      display: block;
      padding-top: 16px;
    }
  `,
})
export class PestanasRutaComponent {
  readonly pestanas = input.required<readonly Pestana[]>();
  readonly etiqueta = input('Secciones');
}
