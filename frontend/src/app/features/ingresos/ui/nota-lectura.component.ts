import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { CampoReconocidoPropuesto } from '@models/registro-ingreso.model';
import { IndicadorConfianzaComponent } from '@shared/components/indicador-confianza/indicador-confianza.component';

/** Cómo está un campo respecto de lo que leyó el reconocimiento. */
export type EstadoLectura = 'ninguna' | 'ok' | 'dudoso' | 'sin-lectura' | 'corregido';

/** La nota bajo un campo reconocido: su confianza, o que el usuario ya lo corrigió. */
@Component({
  selector: 'app-nota-lectura',
  standalone: true,
  imports: [MatIconModule, IndicadorConfianzaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (estado()) {
      @case ('corregido') {
        <span class="corregido"><mat-icon aria-hidden="true">edit</mat-icon>Corregido por usted</span>
      }
      @case ('ninguna') {}
      @default {
        <app-indicador-confianza
          [confianza]="estado() === 'sin-lectura' ? null : (campo()?.confianza ?? null)"
          [dudoso]="estado() === 'dudoso'"
          [aviso]="campo()?.aviso ?? null"
        />
      }
    }
  `,
  styles: `
    .corregido {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--blue);
    }
    mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
  `,
})
export class NotaLecturaComponent {
  readonly campo = input<CampoReconocidoPropuesto | null>(null);
  readonly estado = input<EstadoLectura>('ninguna');
}
