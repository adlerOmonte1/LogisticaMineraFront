import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { comoErrorApi } from '@core/errores/error-inesperado';
import { DescargaService } from '@core/http/descarga.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { Consolidado, Periodo } from '@models/consolidacion.model';
import { ErrorApi } from '@models/error-api.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EstadoVacioComponent } from '@shared/components/estado-vacio/estado-vacio.component';
import { SelectorPeriodoComponent } from '@shared/components/selector-periodo/selector-periodo.component';
import { separarFechaYHoraLima } from '@shared/utils/fecha-hora';
import { ConsolidacionApiService } from '../../data-access/consolidacion-api.service';
import { TablaConsolidadoComponent } from '../../ui/tabla-consolidado/tabla-consolidado.component';

/** El mes en curso en la zona de la planta, no en la del equipo (D-F17). */
export function mesEnCurso(ahora = new Date()): Periodo {
  const [anio, mes] = separarFechaYHoraLima(ahora.toISOString()).fecha.split('-').map(Number);
  return { anio, mes };
}

/** `?anio=&mes=` de la URL; lo que no sea un mes válido cae en el mes en curso. */
export function leerPeriodo(anio: string | undefined, mes: string | undefined, porDefecto: Periodo): Periodo {
  const a = Number(anio);
  const m = Number(mes);
  return Number.isInteger(a) && Number.isInteger(m) && a > 0 && m >= 1 && m <= 12
    ? { anio: a, mes: m }
    : porDefecto;
}

/**
 * Consolidación mensual (HU-M08-01 y 02; tareas T05 y T06): el total del mes por tipo de mineral,
 * con lo que el servidor avisa —En proceso pendientes del destare, anulados excluidos y «al corte
 * de hoy» en el mes en curso— y la exportación a XLSX. El periodo va en la URL (`?anio=&mes=`),
 * así que un mes se puede enlazar; un periodo futuro forzado así lo rechaza el servidor con su
 * mensaje (CA04). El cliente no suma: muestra el cálculo del servidor.
 */
@Component({
  selector: 'app-consolidacion',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    EstadoVacioComponent,
    SelectorPeriodoComponent,
    TablaConsolidadoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consolidacion.page.html',
  styleUrl: './consolidacion.page.scss',
})
export class ConsolidacionPage {
  readonly anio = input<string | undefined>();
  readonly mes = input<string | undefined>();

  private readonly api = inject(ConsolidacionApiService);
  private readonly descarga = inject(DescargaService);
  private readonly notificacion = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly limite = mesEnCurso();
  protected readonly periodo = computed(() => leerPeriodo(this.anio(), this.mes(), this.limite));

  protected readonly datos = signal<Consolidado | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<ErrorApi | null>(null);
  protected readonly exportando = signal(false);

  constructor() {
    effect(() => {
      const periodo = this.periodo();
      untracked(() => this.cargar(periodo));
    });
  }

  /** El periodo elegido pasa a la URL; el `effect` lo consolida. */
  protected cambiarPeriodo({ anio, mes }: Periodo): void {
    void this.router.navigate([], { queryParams: { anio, mes }, replaceUrl: true });
  }

  protected exportar(): void {
    this.exportando.set(true);
    this.api
      .exportar(this.periodo())
      .pipe(finalize(() => this.exportando.set(false)))
      .subscribe({
        next: (archivo) => this.descarga.guardar(archivo),
        // «No hay ingresos registrados…» llega dentro del Blob y el interceptor lo traduce (CA02).
        error: (error: unknown) => this.notificacion.rechazo(error),
      });
  }

  private cargar(periodo: Periodo): void {
    this.cargando.set(true);
    this.error.set(null);
    this.datos.set(null);
    this.api.mensual(periodo).subscribe({
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
