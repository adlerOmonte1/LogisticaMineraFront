import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { Periodo } from '@models/consolidacion.model';

const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/** Años que ofrece el selector hacia atrás desde el límite (o desde el periodo elegido). */
const ANIOS_ATRAS = 5;

export function compararPeriodos(a: Periodo, b: Periodo): number {
  return a.anio - b.anio || a.mes - b.mes;
}

export function periodoAnterior({ anio, mes }: Periodo): Periodo {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

export function periodoSiguiente({ anio, mes }: Periodo): Periodo {
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

/**
 * Mes y año, con flechas para el anterior y el siguiente. Con `limite` (el mes en curso) no
 * ofrece periodos posteriores: la flecha se deshabilita y la lista no los trae (HU-M08-01 CA04).
 * El servidor rechaza un periodo futuro igual, con su mensaje. Presentacional.
 */
@Component({
  selector: 'app-selector-periodo',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="selector" role="group" aria-label="Periodo">
      <button
        mat-icon-button
        type="button"
        aria-label="Mes anterior"
        data-prueba="periodo-anterior"
        (click)="cambio.emit(anterior())"
      >
        <mat-icon>chevron_left</mat-icon>
      </button>
      <mat-form-field class="selector__mes">
        <mat-label>Mes</mat-label>
        <mat-select [value]="periodo().mes" (valueChange)="elegirMes($event)" data-prueba="periodo-mes">
          @for (opcion of meses(); track opcion.mes) {
            <mat-option [value]="opcion.mes">{{ opcion.nombre }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field class="selector__anio">
        <mat-label>Año</mat-label>
        <mat-select [value]="periodo().anio" (valueChange)="elegirAnio($event)" data-prueba="periodo-anio">
          @for (anio of anios(); track anio) {
            <mat-option [value]="anio">{{ anio }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button
        mat-icon-button
        type="button"
        aria-label="Mes siguiente"
        data-prueba="periodo-siguiente"
        [disabled]="!haySiguiente()"
        (click)="cambio.emit(siguiente())"
      >
        <mat-icon>chevron_right</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .selector {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 8px;
    }
    .selector__mes {
      width: 150px;
    }
    .selector__anio {
      width: 110px;
    }
  `,
})
export class SelectorPeriodoComponent {
  readonly periodo = input.required<Periodo>();
  /** Último periodo que se puede elegir; sin él, cualquiera. */
  readonly limite = input<Periodo | null>(null);

  readonly cambio = output<Periodo>();

  protected readonly anterior = computed(() => periodoAnterior(this.periodo()));
  protected readonly siguiente = computed(() => periodoSiguiente(this.periodo()));
  protected readonly haySiguiente = computed(() => {
    const limite = this.limite();
    return limite === null || compararPeriodos(this.siguiente(), limite) <= 0;
  });

  /** Los meses del año elegido; en el año del límite, solo hasta el mes del límite. */
  protected readonly meses = computed(() => {
    const limite = this.limite();
    const tope = limite && this.periodo().anio === limite.anio ? limite.mes : 12;
    return NOMBRES_MES.slice(0, tope).map((nombre, i) => ({ mes: i + 1, nombre }));
  });

  protected readonly anios = computed(() => {
    const ultimo = this.limite()?.anio ?? this.periodo().anio;
    const primero = Math.min(this.periodo().anio, ultimo - ANIOS_ATRAS);
    return Array.from({ length: ultimo - primero + 1 }, (_, i) => ultimo - i);
  });

  protected elegirMes(mes: number): void {
    this.cambio.emit({ anio: this.periodo().anio, mes });
  }

  /** Al cambiar de año, el mes se recorta al límite si hiciera falta. */
  protected elegirAnio(anio: number): void {
    const limite = this.limite();
    const mes =
      limite && anio === limite.anio ? Math.min(this.periodo().mes, limite.mes) : this.periodo().mes;
    this.cambio.emit({ anio, mes });
  }
}
