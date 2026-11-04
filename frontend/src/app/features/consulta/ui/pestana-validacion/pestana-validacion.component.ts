import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { BloqueValidaciones } from '@models/detalle-ingreso.model';
import {
  ETIQUETA_MOMENTO,
  ETIQUETA_RESOLUCION,
  NOMBRE_REGLA,
  ResultadoValidacion,
} from '@models/validacion.model';
import {
  InsigniaEstadoComponent,
  TonoInsignia,
} from '@shared/components/insignia-estado/insignia-estado.component';

interface PresentacionResultado {
  texto: string;
  tono: TonoInsignia;
}

/**
 * El resultado de cada una de las cinco reglas y la justificación, si la hubo (HU-M05-01
 * CA08). Una regla que depende de la tara y aún no pudo evaluarse se evalúa en el destare.
 */
@Component({
  selector: 'app-pestana-validacion',
  standalone: true,
  imports: [MatIconModule, MatTableModule, InsigniaEstadoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pestana-validacion.component.html',
  styleUrl: './pestana-validacion.component.scss',
})
export class PestanaValidacionComponent {
  readonly validaciones = input.required<BloqueValidaciones>();

  protected readonly columnas = ['regla', 'resultado', 'momento', 'justificacion'];

  protected nombre(resultado: ResultadoValidacion): string {
    return NOMBRE_REGLA[resultado.regla];
  }

  protected momento(resultado: ResultadoValidacion): string {
    return ETIQUETA_MOMENTO[resultado.momento];
  }

  protected presentar(resultado: ResultadoValidacion): PresentacionResultado {
    if (resultado.cumple === null) {
      return { texto: 'Se evalúa en el destare', tono: 'neutro' };
    }
    if (resultado.cumple) {
      return { texto: 'Cumple', tono: 'exito' };
    }
    return resultado.resolucion === 'JUSTIFICADA'
      ? { texto: ETIQUETA_RESOLUCION.JUSTIFICADA, tono: 'aviso' }
      : {
          texto: resultado.resolucion === 'CORREGIDA' ? ETIQUETA_RESOLUCION.CORREGIDA : 'No cumple',
          tono: 'error',
        };
  }
}
