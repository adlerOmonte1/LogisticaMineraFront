import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { DEFINICION_PERMISOS } from '@core/autorizacion/permisos';
import { ETIQUETA_ROL, ROLES } from '@models/rol.model';

/**
 * Matriz de solo lectura «función × rol» (HU-M01-03). Se dibuja con la misma tabla que usan
 * el menú y los guards, que es la lectura de `permissions.py`: los roles no se editan aquí.
 */
@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [MatTableModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="texto-secundario">
      Lo que cada rol puede hacer. La autorización la aplica el servidor en cada operación; esta tabla es su
      lectura.
    </p>
    <section class="tarjeta tarjeta--plana">
      <table mat-table [dataSource]="permisos" class="tabla">
        <ng-container matColumnDef="funcion">
          <th mat-header-cell *matHeaderCellDef>Función</th>
          <td mat-cell *matCellDef="let fila">{{ fila.descripcion }}</td>
        </ng-container>
        @for (rol of roles; track rol) {
          <ng-container [matColumnDef]="rol">
            <th mat-header-cell *matHeaderCellDef>{{ etiquetaRol[rol] }}</th>
            <td mat-cell *matCellDef="let fila" [attr.data-etiqueta]="etiquetaRol[rol]">
              @if (fila.roles.includes(rol)) {
                <mat-icon class="permitido" aria-hidden="false" aria-label="Permitido">check_circle</mat-icon>
              } @else {
                <mat-icon class="denegado" aria-hidden="false" aria-label="No permitido">remove</mat-icon>
              }
            </td>
          </ng-container>
        }
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
      </table>
    </section>
  `,
  styles: `
    .permitido {
      color: var(--green);
    }
    .denegado {
      color: var(--label-3);
    }
  `,
})
export class PermisosPage {
  protected readonly permisos = DEFINICION_PERMISOS;
  protected readonly roles = ROLES;
  protected readonly etiquetaRol = ETIQUETA_ROL;
  protected readonly columnas = ['funcion', ...ROLES];
}
