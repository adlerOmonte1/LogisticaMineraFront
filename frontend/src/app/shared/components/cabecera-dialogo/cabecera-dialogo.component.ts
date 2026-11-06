import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogClose, MatDialogTitle } from '@angular/material/dialog';

/**
 * Cabecera de un diálogo como la `sheet` de la maqueta: título (y subtítulo opcional) a la
 * izquierda y el botón de cerrar a la derecha. Cerrar equivale a «Cancelar»: el diálogo se cierra
 * sin resultado. El título sigue siendo el `mat-dialog-title`, así que el diálogo queda nombrado
 * para los lectores de pantalla. Presentacional.
 */
@Component({
  selector: 'app-cabecera-dialogo',
  standalone: true,
  imports: [MatButtonModule, MatDialogClose, MatDialogTitle, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="cabecera">
      <div class="cabecera__textos">
        <h2 mat-dialog-title data-prueba="titulo-dialogo"><ng-content /></h2>
        @if (subtitulo(); as texto) {
          <p class="cabecera__subtitulo">{{ texto }}</p>
        }
      </div>
      <button
        mat-icon-button
        type="button"
        class="cabecera__cerrar"
        mat-dialog-close
        aria-label="Cerrar"
        data-prueba="cerrar-dialogo"
      >
        <mat-icon>close</mat-icon>
      </button>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }
    .cabecera {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px 20px 12px 24px;
    }
    .cabecera__textos {
      flex: 1;
      min-width: 0;
    }
    h2 {
      margin: 0 !important;
      padding: 0 !important;
    }
    .cabecera__subtitulo {
      margin: 3px 0 0;
      font-size: 13.5px;
      color: var(--label-2);
    }
    .cabecera__cerrar {
      flex: none;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 1px solid var(--stroke);
      border-radius: 4px;
      color: var(--label-2);
      --mdc-icon-button-icon-size: 18px;
    }
  `,
})
export class CabeceraDialogoComponent {
  readonly subtitulo = input<string | null>(null);
}
