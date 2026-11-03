import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { Transportista } from '@models/transportista.model';
import { AccionesRegistroComponent } from '@shared/components/acciones-registro/acciones-registro.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';

/** Transportistas del catálogo (HU-M02-03). */
@Component({
  selector: 'app-tabla-transportistas',
  standalone: true,
  imports: [MatTableModule, InsigniaEstadoComponent, AccionesRegistroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table mat-table [dataSource]="transportistas()" class="tabla">
      <ng-container matColumnDef="razonSocial">
        <th mat-header-cell *matHeaderCellDef>Razón social</th>
        <td mat-cell *matCellDef="let transportista">
          <strong>{{ transportista.razon_social }}</strong>
        </td>
      </ng-container>
      <ng-container matColumnDef="ruc">
        <th mat-header-cell *matHeaderCellDef>RUC</th>
        <td mat-cell *matCellDef="let transportista" data-etiqueta="RUC" class="monoespaciado">
          {{ transportista.ruc }}
        </td>
      </ng-container>
      <ng-container matColumnDef="estado">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let transportista">
          <app-insignia-estado
            [texto]="transportista.activo ? 'Activo' : 'De baja'"
            [tono]="transportista.activo ? 'exito' : 'neutro'"
          />
        </td>
      </ng-container>
      <ng-container matColumnDef="acciones">
        <th mat-header-cell *matHeaderCellDef><span class="cdk-visually-hidden">Acciones</span></th>
        <td mat-cell *matCellDef="let transportista" class="celda-acciones">
          <app-acciones-registro
            [nombre]="transportista.razon_social"
            [activo]="transportista.activo"
            (editar)="editar.emit(transportista)"
            (desactivar)="desactivar.emit(transportista)"
            (reactivar)="reactivar.emit(transportista)"
          />
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columnas"></tr>
      <tr mat-row *matRowDef="let transportista; columns: columnas"></tr>
    </table>
  `,
})
export class TablaTransportistasComponent {
  readonly transportistas = input.required<Transportista[]>();
  readonly editar = output<Transportista>();
  readonly desactivar = output<Transportista>();
  readonly reactivar = output<Transportista>();

  protected readonly columnas = ['razonSocial', 'ruc', 'estado', 'acciones'];
}
