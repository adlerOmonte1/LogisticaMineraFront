import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/** Acción adicional de un registro (restablecer contraseña, modificar tara…). */
export interface AccionExtra {
  id: string;
  etiqueta: string;
  icono: string;
  /** Solo se ofrece mientras el registro está activo. */
  soloActivo?: boolean;
}

/**
 * Menú de acciones de una fila: editar, dar de baja o reactivar, y las propias de cada
 * entidad. Nada se elimina (D-07, D-22): la baja es lógica.
 */
@Component({
  selector: 'app-acciones-registro',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-icon-button
      type="button"
      [matMenuTriggerFor]="menu"
      [attr.aria-label]="'Acciones de ' + nombre()"
    >
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #menu="matMenu" xPosition="before">
      @if (editable()) {
        <button mat-menu-item type="button" (click)="editar.emit()">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
      }
      @for (accion of extrasVisibles(); track accion.id) {
        <button mat-menu-item type="button" (click)="accionExtra.emit(accion.id)">
          <mat-icon>{{ accion.icono }}</mat-icon>
          {{ accion.etiqueta }}
        </button>
      }
      @if (activo()) {
        <button mat-menu-item type="button" (click)="desactivar.emit()">
          <mat-icon>block</mat-icon>
          {{ textoDesactivar() }}
        </button>
      } @else {
        <button mat-menu-item type="button" (click)="reactivar.emit()">
          <mat-icon>restore</mat-icon>
          Reactivar
        </button>
      }
    </mat-menu>
  `,
})
export class AccionesRegistroComponent {
  readonly nombre = input.required<string>();
  readonly activo = input.required<boolean>();
  readonly editable = input(true);
  readonly textoDesactivar = input('Dar de baja');
  readonly extras = input<readonly AccionExtra[]>([]);

  readonly editar = output<void>();
  readonly desactivar = output<void>();
  readonly reactivar = output<void>();
  readonly accionExtra = output<string>();

  protected readonly extrasVisibles = computed(() =>
    this.extras().filter((accion) => this.activo() || !accion.soloActivo),
  );
}
