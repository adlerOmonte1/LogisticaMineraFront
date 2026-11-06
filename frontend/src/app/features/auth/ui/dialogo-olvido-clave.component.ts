import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CabeceraDialogoComponent } from '@shared/components/cabecera-dialogo/cabecera-dialogo.component';

/**
 * «¿Olvidó su contraseña?» (HU-M01-01 CA08): no consulta nada, así que no puede revelar si
 * el usuario existe. Texto de la maqueta.
 */
@Component({
  selector: 'app-dialogo-olvido-clave',
  standalone: true,
  imports: [CabeceraDialogoComponent, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera-dialogo>Restablecer contraseña</app-cabecera-dialogo>
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
