import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Título de la pantalla con su descripción y, a la derecha, sus acciones (`ng-content`). */
@Component({
  selector: 'app-encabezado-pagina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado">
      <div class="encabezado__textos">
        <h1 class="encabezado__titulo">{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p class="encabezado__subtitulo">{{ subtitulo() }}</p>
        }
      </div>
      <div class="encabezado__acciones"><ng-content /></div>
    </header>
  `,
  styles: `
    .encabezado {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px 24px;
      margin-bottom: 20px;
    }
    .encabezado__titulo {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 700;
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
  `,
})
export class EncabezadoPaginaComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | null>(null);
}
