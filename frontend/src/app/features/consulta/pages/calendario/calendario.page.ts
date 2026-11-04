import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { comoErrorApi } from '@core/errores/error-inesperado';
import { CalendarioMes, DiaCalendario } from '@models/consulta.model';
import { ErrorApi } from '@models/error-api.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EstadoVacioComponent } from '@shared/components/estado-vacio/estado-vacio.component';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { separarFechaYHoraLima } from '@shared/utils/fecha-hora';
import { ConsultaApiService } from '../../data-access/consulta-api.service';
import { TablaIngresosComponent } from '../../ui/tabla-ingresos/tabla-ingresos.component';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

const FORMATO_MES = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Día del mes de una fecha `AAAA-MM-DD`, sin pasar por una zona horaria. */
export function numeroDeDia(fecha: string): number {
  return Number(fecha.slice(8, 10));
}

/**
 * Cuántas celdas vacías van antes del día 1 con la semana empezando en lunes. Se calcula con
 * UTC para que el desfase del teléfono no mueva el día.
 */
export function celdasPrevias(anio: number, mes: number): number {
  const diaSemana = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  return (diaSemana + 6) % 7;
}

/**
 * Calendario de llegadas (HU-M07-03): cada día con sus ingresos y toneladas **como texto**, y los
 * días con anulados o con ingresos En proceso marcados con icono y palabra, no solo con color
 * (RNF-M07-11). Al elegir un día se lista con hora, placa, código, mineral, neto y estado; un
 * día sin llegadas muestra el mensaje del servidor.
 */
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    EstadoVacioComponent,
    TablaIngresosComponent,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendario.page.html',
  styleUrl: './calendario.page.scss',
})
export class CalendarioPage implements OnInit {
  private readonly api = inject(ConsultaApiService);

  protected readonly diasSemana = DIAS_SEMANA;
  protected readonly anio = signal(0);
  protected readonly mes = signal(0);
  protected readonly datos = signal<CalendarioMes | null>(null);
  protected readonly diaElegido = signal<number | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<ErrorApi | null>(null);

  protected readonly titulo = computed(() =>
    this.anio() === 0 ? '' : FORMATO_MES.format(new Date(Date.UTC(this.anio(), this.mes() - 1, 1))),
  );
  protected readonly previas = computed(() => Array.from({ length: celdasPrevias(this.anio(), this.mes()) }));
  protected readonly numeroDeDia = numeroDeDia;

  ngOnInit(): void {
    this.irAlMesActual();
  }

  protected irAlMesActual(): void {
    const [anio, mes] = separarFechaYHoraLima(new Date().toISOString()).fecha.split('-').map(Number);
    this.cambiarMes(anio, mes);
  }

  protected mesAnterior(): void {
    this.cambiarMes(this.mes() === 1 ? this.anio() - 1 : this.anio(), this.mes() === 1 ? 12 : this.mes() - 1);
  }

  protected mesSiguiente(): void {
    this.cambiarMes(
      this.mes() === 12 ? this.anio() + 1 : this.anio(),
      this.mes() === 12 ? 1 : this.mes() + 1,
    );
  }

  protected elegirDia(dia: DiaCalendario): void {
    this.diaElegido.set(numeroDeDia(dia.fecha));
    this.cargar();
  }

  /** «3 ingresos, 39,60 t, con anulados» para quien lee la cuadrícula con un lector de pantalla. */
  protected descripcion(dia: DiaCalendario): string {
    const partes = [
      `${numeroDeDia(dia.fecha)}: ${dia.ingresos} ${dia.ingresos === 1 ? 'ingreso' : 'ingresos'}`,
    ];
    if (dia.ingresos > 0) {
      partes.push(`${dia.toneladas} t`);
    }
    if (dia.con_en_proceso) {
      partes.push('con ingresos en proceso');
    }
    if (dia.con_anulados) {
      partes.push('con anulados');
    }
    return partes.join(', ');
  }

  private cambiarMes(anio: number, mes: number): void {
    this.anio.set(anio);
    this.mes.set(mes);
    this.diaElegido.set(null);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.calendario(this.anio(), this.mes(), this.diaElegido() ?? undefined).subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(comoErrorApi(error));
        this.cargando.set(false);
      },
    });
  }
}
