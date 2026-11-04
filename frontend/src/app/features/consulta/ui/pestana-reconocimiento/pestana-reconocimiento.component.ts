import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { BloqueReconocimiento } from '@models/detalle-ingreso.model';
import { CampoReconocidoGuardado } from '@models/reconocimiento.model';
import { NombreCampoReconocido } from '@models/registro-ingreso.model';
import { IndicadorConfianzaComponent } from '@shared/components/indicador-confianza/indicador-confianza.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';

const ETIQUETA_CAMPO: Readonly<Record<NombreCampoReconocido, string>> = {
  PLACA: 'Placa',
  FECHA: 'Fecha',
  PESO_BRUTO: 'Peso bruto',
};

/**
 * Lo reconocido frente a lo confirmado, campo por campo (HU-M04-02). Un campo corregido se
 * señala; un ingreso sin reconocimiento dice por qué (CA03). En modo lectura: la corrección
 * es del detalle, no de esta pestaña (CA04).
 */
@Component({
  selector: 'app-pestana-reconocimiento',
  standalone: true,
  imports: [
    MatIconModule,
    MatTableModule,
    FechaLimaPipe,
    IndicadorConfianzaComponent,
    InsigniaEstadoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pestana-reconocimiento.component.html',
  styleUrl: './pestana-reconocimiento.component.scss',
})
export class PestanaReconocimientoComponent {
  readonly reconocimiento = input.required<BloqueReconocimiento>();

  protected readonly columnas = ['campo', 'reconocido', 'confirmado', 'confianza'];

  protected etiqueta(campo: CampoReconocidoGuardado): string {
    return ETIQUETA_CAMPO[campo.nombre_campo];
  }
}
