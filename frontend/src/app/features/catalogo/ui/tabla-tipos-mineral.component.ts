import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { TipoMineral } from '@models/tipo-mineral.model';
import { AccionesRegistroComponent } from '@shared/components/acciones-registro/acciones-registro.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';

/** Tipos de mineral del catálogo (HU-M02-02). */
@Component({
  selector: 'app-tabla-tipos-mineral',
  standalone: true,
  imports: [MatTableModule, InsigniaEstadoComponent, AccionesRegistroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table mat-table [dataSource]="tiposMineral()" class="tabla">
      <ng-container matColumnDef="codigo">
        <th mat-header-cell *matHeaderCellDef>Código</th>
        <td mat-cell *matCellDef="let tipo">
          <strong class="monoespaciado">{{ tipo.codigo }}</strong>
        </td>
      </ng-container>
      <ng-container matColumnDef="nombre">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let tipo" data-etiqueta="Nombre">{{ tipo.nombre }}</td>
      </ng-container>
      <ng-container matColumnDef="unidad">
        <th mat-header-cell *matHeaderCellDef>Unidad</th>
        <td mat-cell *matCellDef="let tipo" data-etiqueta="Unidad">Toneladas</td>
      </ng-container>
      <ng-container matColumnDef="estado">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let tipo">
          <app-insignia-estado
            [texto]="tipo.activo ? 'Activo' : 'De baja'"
            [tono]="tipo.activo ? 'exito' : 'neutro'"
          />
        </td>
      </ng-container>
      <ng-container matColumnDef="acciones">
        <th mat-header-cell *matHeaderCellDef><span class="cdk-visually-hidden">Acciones</span></th>
        <td mat-cell *matCellDef="let tipo" class="celda-acciones">
          <app-acciones-registro
            [nombre]="tipo.nombre"
            [activo]="tipo.activo"
            (editar)="editar.emit(tipo)"
            (desactivar)="desactivar.emit(tipo)"
            (reactivar)="reactivar.emit(tipo)"
          />
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columnas"></tr>
      <tr mat-row *matRowDef="let tipo; columns: columnas"></tr>
    </table>
  `,
})
export class TablaTiposMineralComponent {
  readonly tiposMineral = input.required<TipoMineral[]>();
  readonly editar = output<TipoMineral>();
  readonly desactivar = output<TipoMineral>();
  readonly reactivar = output<TipoMineral>();

  protected readonly columnas = ['codigo', 'nombre', 'unidad', 'estado', 'acciones'];
}
