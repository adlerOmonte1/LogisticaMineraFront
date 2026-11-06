import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  /** Acción que cambia el estado de un registro: el botón se pinta como advertencia. */
  advertencia?: boolean;
}

/**
 * Confirmación de una acción, con el formato de alerta de la maqueta (`alertBox`): icono, título y
 * mensaje centrados y los dos botones a lo ancho. Devuelve `true` al confirmar.
 */
@Component({
  selector: 'app-dialogo-confirmacion',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alerta">
      <span class="alerta__icono" [class.alerta__icono--aviso]="datos.advertencia" aria-hidden="true">
        <mat-icon>{{ datos.advertencia ? 'warning' : 'help_outline' }}</mat-icon>
      </span>
      <h2 mat-dialog-title>{{ datos.titulo }}</h2>
      <mat-dialog-content>
        <p>{{ datos.mensaje }}</p>
      </mat-dialog-content>
      <mat-dialog-actions class="alerta__acciones">
        <button mat-stroked-button type="button" [mat-dialog-close]="false">Cancelar</button>
        <button
          mat-flat-button
          type="button"
          [color]="datos.advertencia ? 'warn' : 'primary'"
          [mat-dialog-close]="true"
          cdkFocusInitial
        >
          {{ datos.textoConfirmar }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    .alerta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 24px 24px 8px;
      text-align: center;
    }
    .alerta__icono {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      margin-bottom: 4px;
      border-radius: 6px;
      background: var(--accent-tint);
      color: var(--gold-h);
      .mat-icon {
        width: 28px;
        height: 28px;
        font-size: 28px;
      }
    }
    .alerta__icono--aviso {
      background: color-mix(in srgb, var(--orange-b) 14%, transparent);
      color: var(--orange-b);
    }
    h2 {
      margin: 0 !important;
      padding: 0 !important;
      font-size: 21px;
    }
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.45;
      color: var(--label-2);
    }
    mat-dialog-content {
      padding: 0 !important;
    }
    .alerta__acciones {
      width: 100%;
      margin-top: 8px;
      padding: 12px 0 16px !important;
      background: none !important;
      border-top: 0 !important;
      button {
        flex: 1;
      }
    }
  `,
})
export class DialogoConfirmacionComponent {
  protected readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}
