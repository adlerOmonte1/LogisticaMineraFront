import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  /** Acción que cambia el estado de un registro: el botón se pinta como advertencia. */
  advertencia?: boolean;
}

/** Confirmación de una acción. Devuelve `true` al confirmar. */
@Component({
  selector: 'app-dialogo-confirmacion',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>
      <p>{{ datos.mensaje }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
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
  `,
})
export class DialogoConfirmacionComponent {
  protected readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}
