import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { ResultadoDestare } from '@models/ingreso.model';
import { InsigniaIngresoComponent } from '@shared/components/insignia-ingreso/insignia-ingreso.component';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * El destare quedó registrado: el mensaje del servidor y la lista de ingresos que pasaron a
 * Registrado con su peso neto (HU-M03-04 CA01, CA07).
 */
@Component({
  selector: 'app-resultado-destare',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    InsigniaIngresoComponent,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta resultado" role="status">
      <h2 class="resultado__mensaje" data-prueba="mensaje-destare">
        <mat-icon aria-hidden="true">check_circle</mat-icon>
        {{ resultado().mensaje }}
      </h2>
      <p class="texto-secundario">
        Tara de <strong class="monoespaciado">{{ resultado().vehiculo.placa }}</strong
        >:
        <strong class="monoespaciado">{{ resultado().vehiculo.tara_tn | toneladas }}</strong>
      </p>
      <table mat-table [dataSource]="resultado().ingresos" class="tabla">
        <ng-container matColumnDef="codigo">
          <th mat-header-cell *matHeaderCellDef>Ingreso</th>
          <td mat-cell *matCellDef="let ingreso">
            <a [routerLink]="['/consulta/ingresos', ingreso.id]" class="monoespaciado">{{
              ingreso.codigo
            }}</a>
          </td>
        </ng-container>
        <ng-container matColumnDef="bruto">
          <th mat-header-cell *matHeaderCellDef>Peso bruto</th>
          <td mat-cell *matCellDef="let ingreso" data-etiqueta="Peso bruto" class="monoespaciado">
            {{ ingreso.peso_bruto_tn | toneladas }}
          </td>
        </ng-container>
        <ng-container matColumnDef="neto">
          <th mat-header-cell *matHeaderCellDef>Peso neto</th>
          <td mat-cell *matCellDef="let ingreso" data-etiqueta="Peso neto" class="monoespaciado">
            {{ ingreso.peso_neto_tn | toneladas }}
          </td>
        </ng-container>
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let ingreso"><app-insignia-ingreso [estado]="ingreso.estado" /></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let ingreso; columns: columnas"></tr>
      </table>
      <div class="acciones-formulario">
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="continuar.emit()"
          data-prueba="continuar-destares"
        >
          Continuar
        </button>
      </div>
    </section>
  `,
  styles: `
    .resultado__mensaje {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: var(--green);
    }
  `,
})
export class ResultadoDestareComponent {
  readonly resultado = input.required<ResultadoDestare>();
  readonly continuar = output<void>();

  protected readonly columnas = ['codigo', 'bruto', 'neto', 'estado'];
}
