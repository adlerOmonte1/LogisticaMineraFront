import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { Vehiculo } from '@models/vehiculo.model';
import {
  AccionExtra,
  AccionesRegistroComponent,
} from '@shared/components/acciones-registro/acciones-registro.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { EtiquetaTitularidadPipe } from '@shared/pipes/etiqueta-titularidad.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

const MODIFICAR_TARA = 'modificar-tara';

/** Vehículos del catálogo (HU-M02-01). Sin tara se muestran «Pendiente de destare» (CA08). */
@Component({
  selector: 'app-tabla-vehiculos',
  standalone: true,
  imports: [
    MatTableModule,
    InsigniaEstadoComponent,
    AccionesRegistroComponent,
    EtiquetaTitularidadPipe,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table mat-table [dataSource]="vehiculos()" class="tabla">
      <ng-container matColumnDef="placa">
        <th mat-header-cell *matHeaderCellDef>Placa</th>
        <td mat-cell *matCellDef="let vehiculo">
          <strong class="monoespaciado">{{ vehiculo.placa }}</strong>
        </td>
      </ng-container>
      <ng-container matColumnDef="titularidad">
        <th mat-header-cell *matHeaderCellDef>Titularidad</th>
        <td mat-cell *matCellDef="let vehiculo" data-etiqueta="Titularidad">
          {{ vehiculo.titularidad | etiquetaTitularidad }}
        </td>
      </ng-container>
      <ng-container matColumnDef="transportista">
        <th mat-header-cell *matHeaderCellDef>Transportista</th>
        <td mat-cell *matCellDef="let vehiculo" data-etiqueta="Transportista">
          {{ vehiculo.transportista_nombre ?? '—' }}
        </td>
      </ng-container>
      <ng-container matColumnDef="capacidad">
        <th mat-header-cell *matHeaderCellDef>Capacidad</th>
        <td mat-cell *matCellDef="let vehiculo" data-etiqueta="Capacidad" class="monoespaciado">
          {{ vehiculo.capacidad_tn | toneladas }}
        </td>
      </ng-container>
      <ng-container matColumnDef="tara">
        <th mat-header-cell *matHeaderCellDef>Tara</th>
        <td mat-cell *matCellDef="let vehiculo" data-etiqueta="Tara" class="monoespaciado">
          @if (vehiculo.pendiente_destare) {
            <app-insignia-estado texto="Pendiente de destare" tono="aviso" />
          } @else {
            {{ vehiculo.tara_tn | toneladas }}
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="estado">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let vehiculo">
          <app-insignia-estado
            [texto]="vehiculo.activo ? 'Activo' : 'De baja'"
            [tono]="vehiculo.activo ? 'exito' : 'neutro'"
          />
        </td>
      </ng-container>
      <ng-container matColumnDef="acciones">
        <th mat-header-cell *matHeaderCellDef><span class="cdk-visually-hidden">Acciones</span></th>
        <td mat-cell *matCellDef="let vehiculo" class="celda-acciones">
          <app-acciones-registro
            [nombre]="vehiculo.placa"
            [activo]="vehiculo.activo"
            [extras]="vehiculo.pendiente_destare ? [] : extras()"
            (editar)="editar.emit(vehiculo)"
            (desactivar)="desactivar.emit(vehiculo)"
            (reactivar)="reactivar.emit(vehiculo)"
            (accionExtra)="modificarTara.emit(vehiculo)"
          />
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columnas"></tr>
      <tr mat-row *matRowDef="let vehiculo; columns: columnas"></tr>
    </table>
  `,
})
export class TablaVehiculosComponent {
  readonly vehiculos = input.required<Vehiculo[]>();
  /**
   * Solo el Administrador modifica una tara ya registrada (HU-M02-01 CA09); lo decide la
   * página. Un vehículo pendiente de destare recibe su tara en el destare (HU-M03-04).
   */
  readonly puedeModificarTara = input(false);

  readonly editar = output<Vehiculo>();
  readonly desactivar = output<Vehiculo>();
  readonly reactivar = output<Vehiculo>();
  readonly modificarTara = output<Vehiculo>();

  protected readonly columnas = [
    'placa',
    'titularidad',
    'transportista',
    'capacidad',
    'tara',
    'estado',
    'acciones',
  ];
  protected readonly extras = computed<AccionExtra[]>(() =>
    this.puedeModificarTara()
      ? [{ id: MODIFICAR_TARA, etiqueta: 'Modificar tara', icono: 'scale', soloActivo: true }]
      : [],
  );
}
