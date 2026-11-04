import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { comoErrorApi } from '@core/errores/error-inesperado';
import { FilaIngreso, FiltroBusqueda } from '@models/consulta.model';
import { DetalleIngreso } from '@models/detalle-ingreso.model';
import { ErrorApi } from '@models/error-api.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { normalizarPlaca } from '@shared/utils/placa';
import { ConsultaApiService } from '../../data-access/consulta-api.service';
import { TicketImagen } from '../../data-access/ticket-imagen';
import { PestanaDatosComponent } from '../../ui/pestana-datos/pestana-datos.component';
import { PestanaTicketComponent } from '../../ui/pestana-ticket/pestana-ticket.component';
import { PestanaTrazabilidadComponent } from '../../ui/pestana-trazabilidad/pestana-trazabilidad.component';
import { TablaIngresosComponent } from '../../ui/tabla-ingresos/tabla-ingresos.component';

const BUSQUEDA_VACIA: FiltroBusqueda = { placa: '', fecha: '', hasta: '' };

/**
 * Consulta por placa y fecha (HU-M07-01, indicador T03): la placa puede ser parcial y la fecha,
 * un día o un rango. Los resultados van del más reciente al más antiguo, con el anulado, el En
 * proceso y el que no tiene foto señalados en la fila. Al elegir uno se abre **junto a sus
 * datos** el ticket, ampliable (CA03), y su lote con el recorrido (CA10, CA11). Sin criterios, un
 * rango inverso o sin resultados responde el servidor con su mensaje literal (CA04, CA06, CA12).
 * `placa` y `fecha` pueden llegar en la URL desde la cabecera y el inicio.
 */
@Component({
  selector: 'app-consulta-placa-fecha',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    MarcoListadoComponent,
    PestanaDatosComponent,
    PestanaTicketComponent,
    PestanaTrazabilidadComponent,
    TablaIngresosComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consulta-placa-fecha.page.html',
  styleUrl: './consulta-placa-fecha.page.scss',
})
export class ConsultaPlacaFechaPage {
  /** Criterios que traen la cabecera (`?placa=`) y el inicio (`?placa=&fecha=`). */
  readonly placa = input<string | undefined>();
  readonly fecha = input<string | undefined>();

  private readonly api = inject(ConsultaApiService);

  protected readonly formulario = new FormGroup({
    placa: new FormControl('', { nonNullable: true }),
    fecha: new FormControl('', { nonNullable: true }),
    hasta: new FormControl('', { nonNullable: true }),
  });

  /** Aún no se buscó nada: no se muestra «sin resultados» antes de tiempo. */
  protected readonly buscado = signal(false);
  protected readonly listado = crearListadoPaginado<FilaIngreso, FiltroBusqueda>(
    (filtro, pagina) => this.api.buscar(filtro, pagina),
    BUSQUEDA_VACIA,
  );

  protected readonly elegido = signal<FilaIngreso | null>(null);
  protected readonly detalle = signal<DetalleIngreso | null>(null);
  protected readonly cargandoDetalle = signal(false);
  protected readonly errorDetalle = signal<ErrorApi | null>(null);
  protected readonly ticket = new TicketImagen(this.api, inject(DestroyRef));

  constructor() {
    effect(() => {
      const placa = this.placa();
      const fecha = this.fecha();
      if (placa || fecha) {
        untracked(() => {
          this.formulario.patchValue({ placa: placa ?? '', fecha: fecha ?? '' });
          this.buscar();
        });
      }
    });
  }

  protected buscar(): void {
    const { placa, fecha, hasta } = this.formulario.getRawValue();
    this.cerrarDetalle();
    this.buscado.set(true);
    this.listado.filtrar({ placa: normalizarPlaca(placa), fecha, hasta });
  }

  protected limpiar(): void {
    this.formulario.reset();
    this.cerrarDetalle();
    this.buscado.set(false);
    this.listado.datos.set(null);
    this.listado.error.set(null);
  }

  protected elegir(fila: FilaIngreso): void {
    this.elegido.set(fila);
    this.detalle.set(null);
    this.errorDetalle.set(null);
    this.cargandoDetalle.set(true);
    this.ticket.liberar();
    this.api.detalleIngreso(fila.id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargandoDetalle.set(false);
        if (detalle.respaldo.tipo === 'IMAGEN') {
          this.ticket.cargar(detalle.id);
        }
      },
      error: (error: unknown) => {
        this.errorDetalle.set(comoErrorApi(error));
        this.cargandoDetalle.set(false);
      },
    });
  }

  protected cerrarDetalle(): void {
    this.elegido.set(null);
    this.detalle.set(null);
    this.errorDetalle.set(null);
    this.ticket.liberar();
  }
}
