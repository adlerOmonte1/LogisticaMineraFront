import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/** Enlace de regreso sobre el título, como `head(…, back)` de la maqueta. */
export interface EnlaceVolver {
  texto: string;
  ruta: string;
}

/**
 * Título de la pantalla con su descripción y, a la derecha, sus acciones (`ng-content`). Con
 * `volver`, un enlace a la pantalla madre encima del título.
 */
@Component({
  selector: 'app-encabezado-pagina',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado">
      @if (volver(); as volver) {
        <a class="encabezado__volver" [routerLink]="volver.ruta" data-prueba="volver">
          <mat-icon>chevron_left</mat-icon>{{ volver.texto }}
        </a>
      }
      <div class="encabezado__fila">
        <div class="encabezado__textos">
          <h1 class="encabezado__titulo">{{ titulo() }}</h1>
          @if (subtitulo()) {
            <p class="encabezado__subtitulo">{{ subtitulo() }}</p>
          }
        </div>
        <div class="encabezado__acciones"><ng-content /></div>
      </div>
    </header>
  `,
  styles: `
    .encabezado {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 20px;
    }
    .encabezado__volver {
      display: inline-flex;
      align-items: center;
      width: max-content;
      font-size: 14px;
      text-decoration: none;
      .mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }
      &:hover {
        text-decoration: underline;
      }
    }
    .encabezado__fila {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px 24px;
    }
    .encabezado__titulo {
      margin: 0;
      font: 700 30px/1.1 var(--font-d, var(--font));
      letter-spacing: 0.005em;
      color: var(--label);
    }
    .encabezado__subtitulo {
      margin: 4px 0 0;
      color: var(--label-2);
    }
    .encabezado__acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    @media (max-width: 767px) {
      .encabezado__titulo {
        font-size: 26px;
      }
    }
  `,
})
export class EncabezadoPaginaComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | null>(null);
  readonly volver = input<EnlaceVolver | null>(null);
}
