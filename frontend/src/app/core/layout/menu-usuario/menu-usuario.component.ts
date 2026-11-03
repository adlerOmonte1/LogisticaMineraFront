import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { UsuarioSesion } from '@models/usuario.model';
import { EtiquetaRolPipe } from '@shared/pipes/etiqueta-rol.pipe';

/** Menú del usuario de la cabecera: quién es, cambiar contraseña y cerrar sesión. */
@Component({
  selector: 'app-menu-usuario',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, EtiquetaRolPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button mat-button type="button" class="usuario" [matMenuTriggerFor]="menu" aria-label="Menú del usuario">
      <mat-icon>account_circle</mat-icon>
      <span class="usuario__nombre">{{ usuario().nombre_completo || usuario().username }}</span>
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      <div class="usuario__ficha" role="presentation">
        <strong>{{ usuario().nombre_completo || usuario().username }}</strong>
        <span>{{ usuario().rol | etiquetaRol }}</span>
      </div>
      <mat-divider />
      @if (puedeCambiarClave()) {
        <button mat-menu-item type="button" (click)="cambiarClave.emit()">
          <mat-icon>key</mat-icon>
          Cambiar contraseña
        </button>
      }
      <button mat-menu-item type="button" (click)="cerrarSesion.emit()">
        <mat-icon>logout</mat-icon>
        Cerrar sesión
      </button>
    </mat-menu>
  `,
  styles: `
    .usuario__nombre {
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .usuario__ficha {
      display: grid;
      padding: 8px 16px 12px;
      color: var(--label-2);
      font-size: 0.85rem;
    }
    .usuario__ficha strong {
      color: var(--label);
      font-size: 1rem;
    }
    @media (max-width: 599px) {
      .usuario__nombre {
        display: none;
      }
    }
  `,
})
export class MenuUsuarioComponent {
  readonly usuario = input.required<UsuarioSesion>();
  readonly puedeCambiarClave = input(true);
  readonly cambiarClave = output<void>();
  readonly cerrarSesion = output<void>();
}
