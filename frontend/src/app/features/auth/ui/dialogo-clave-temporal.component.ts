import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { ClaveTemporal } from '@models/usuario.model';
import { CabeceraDialogoComponent } from '@shared/components/cabecera-dialogo/cabecera-dialogo.component';

/**
 * Muestra la contraseña temporal **una sola vez** (HU-M01-02 CA08). Al cerrar el diálogo no
 * queda en ningún estado del cliente.
 */
@Component({
  selector: 'app-dialogo-clave-temporal',
  standalone: true,
  imports: [CabeceraDialogoComponent, MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera-dialogo>Contraseña temporal de {{ datos.username }}</app-cabecera-dialogo>
    <mat-dialog-content>
      <p>Entréguela a la persona; deberá cambiarla al iniciar sesión. No volverá a mostrarse.</p>
      <p class="clave monoespaciado" data-prueba="clave-temporal">{{ datos.clave_temporal }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="copiar()">
        <mat-icon>{{ copiada() ? 'check' : 'content_copy' }}</mat-icon>
        {{ copiada() ? 'Copiada' : 'Copiar' }}
      </button>
      <button mat-flat-button color="primary" type="button" mat-dialog-close>Listo</button>
    </mat-dialog-actions>
  `,
  styles: `
    .clave {
      margin: 16px 0 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      user-select: all;
    }
  `,
})
export class DialogoClaveTemporalComponent {
  protected readonly datos = inject<ClaveTemporal>(MAT_DIALOG_DATA);
  private readonly portapapeles = inject(Clipboard);
  protected readonly copiada = signal(false);

  copiar(): void {
    this.copiada.set(this.portapapeles.copy(this.datos.clave_temporal));
  }
}
