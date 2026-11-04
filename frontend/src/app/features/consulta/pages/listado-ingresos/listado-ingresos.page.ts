import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, tap } from 'rxjs';

import { SiPuedeDirective } from '@core/autorizacion/si-puede.directive';
import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { DescargaService } from '@core/http/descarga.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { FilaIngreso, FiltroListado, ResultadoConsulta } from '@models/consulta.model';
import { ETIQUETA_ESTADO_INGRESO, EstadoIngreso } from '@models/ingreso.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { ETIQUETA_TITULARIDAD, Titularidad } from '@models/vehiculo.model';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { ConsultaApiService } from '../../data-access/consulta-api.service';
import { TablaIngresosComponent } from '../../ui/tabla-ingresos/tabla-ingresos.component';

const FILTRO_INICIAL: FiltroListado = {
  fecha_desde: '',
  fecha_hasta: '',
  tipo_mineral: null,
  titularidad: null,
  estado: null,
  q: '',
};

/**
 * Listado de ingresos (HU-M07-02): descendente y paginado, con filtros combinables, los totales
 * del conjunto completo —sin contar anulados ni En proceso— y, para gestión, la exportación en
 * CSV. Sin fechas, el servidor presenta el mes en curso y la pantalla lo dice (CA08). Un rango
 * inverso, un conjunto vacío o una exportación vacía vuelven con el mensaje del servidor.
 */
@Component({
  selector: 'app-listado-ingresos',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    SiPuedeDirective,
    EncabezadoPaginaComponent,
    MarcoListadoComponent,
    TablaIngresosComponent,
    FechaLimaPipe,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listado-ingresos.page.html',
})
export class ListadoIngresosPage implements OnInit {
  private readonly api = inject(ConsultaApiService);
  private readonly tiposMineral = inject(TiposMineralApiService);
  private readonly descarga = inject(DescargaService);
  private readonly notificacion = inject(NotificacionService);

  protected readonly titularidades = Object.entries(ETIQUETA_TITULARIDAD) as [Titularidad, string][];
  protected readonly estados = Object.entries(ETIQUETA_ESTADO_INGRESO) as [EstadoIngreso, string][];
  protected readonly minerales = signal<TipoMineral[]>([]);
  /** Última respuesta completa: de ella salen los totales y el rango que aplicó el servidor. */
  protected readonly resultado = signal<ResultadoConsulta | null>(null);
  protected readonly exportando = signal(false);

  protected readonly listado = crearListadoPaginado<FilaIngreso, FiltroListado>(
    (filtro, pagina) =>
      this.api.listar(filtro, pagina).pipe(tap((respuesta) => this.resultado.set(respuesta))),
    FILTRO_INICIAL,
  );

  ngOnInit(): void {
    this.listado.cargar();
    this.tiposMineral.listarVigentes().subscribe({ next: (lista) => this.minerales.set(lista) });
  }

  protected filtrar(cambios: Partial<FiltroListado>): void {
    this.listado.filtrar(cambios);
  }

  protected filtrarPorTexto(evento: Event): void {
    this.filtrar({ q: (evento.target as HTMLInputElement).value.trim() });
  }

  protected limpiar(): void {
    this.filtrar({ ...FILTRO_INICIAL });
  }

  /** Descarga el conjunto completo con el nombre que pone el servidor (CA13). */
  protected exportar(): void {
    this.exportando.set(true);
    this.api
      .exportar(this.listado.filtro())
      .pipe(finalize(() => this.exportando.set(false)))
      .subscribe({
        next: (archivo) => this.descarga.guardar(archivo),
        // «No hay ingresos para exportar» llega dentro de un Blob y el interceptor lo traduce (CA14).
        error: (error: unknown) => this.notificacion.rechazo(error),
      });
  }
}
