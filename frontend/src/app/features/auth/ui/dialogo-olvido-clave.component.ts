import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/**
 * «¿Olvidó su contraseña?» (HU-M01-01 CA08): no consulta nada, así que no puede revelar si
 * el usuario existe. Texto de la maqueta.
 */
@Component({
  selector: 'app-dialogo-olvido-clave',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Restablecer contraseña</h2>
    <mat-dialog-content>
      <p>
        Por seguridad, solo el Administrador puede restablecer una contraseña. Pídale una contraseña temporal
        y cámbiela al iniciar sesión.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" type="button" mat-dialog-close cdkFocusInitial>
        Entendido
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogoOlvidoClaveComponent {}
