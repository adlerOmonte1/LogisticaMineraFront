import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { SiPuedeDirective } from '@core/autorizacion/si-puede.directive';
import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { AvisosService } from '@core/consulta/avisos.service';
import { ESTADOS_LOTE, EstadoLote, FiltroLotes, LoteFila } from '@models/lote.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { LotesApiService } from '../../data-access/lotes-api.service';
import { TablaLotesComponent } from '../../ui/tabla-lotes/tabla-lotes.component';
import { AvisoFranjaComponent } from '@shared/components/aviso-franja/aviso-franja.component';

/**
 * Lotes de proceso con la disposición de la maqueta (`pLotes`, D-F45): aviso de ingresos que
 * esperan en cancha sin lote, botones segmentados por estado y la tabla con su ficha de estado.
 * Se conservan los filtros de mineral y fechas (HU-M06-01). Los tres roles los consultan; abrir
 * un lote es de gestión. Un rango de fechas inverso lo rechaza el servidor con su mensaje.
 */
const TEXTO_SEGMENTO: Readonly<Record<EstadoLote, string>> = {
  ABIERTO: 'Abiertos',
  EN_RECORRIDO: 'En recorrido',
  CERRADO: 'Cerrados',
};

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    AvisoFranjaComponent,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    SiPuedeDirective,
    EncabezadoPaginaComponent,
    MarcoListadoComponent,
    TablaLotesComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lotes.page.html',
  styles: `
    .seg {
      display: inline-flex;
      max-width: 100%;
      overflow-x: auto;
      border: 1px solid var(--stroke);
      border-radius: 4px;
      background: var(--surface);
      scrollbar-width: none;
      > button {
        padding: 7px 15px;
        border: 0;
        border-right: 1px solid var(--stroke);
        background: none;
        color: var(--label-2);
        font: 500 13.5px var(--font);
        white-space: nowrap;
        cursor: pointer;
        &:last-child {
          border-right: 0;
        }
        &:hover {
          background: var(--hover);
          color: var(--label);
        }
        &.on {
          background: var(--ink);
          color: #fff;
          font-weight: 600;
        }
      }
    }
  `,
})
export class LotesPage implements OnInit {
  private readonly api = inject(LotesApiService);
  private readonly tiposMineral = inject(TiposMineralApiService);
  private readonly avisos = inject(AvisosService);

  protected readonly segmentos = ESTADOS_LOTE.map((estado) => ({
    estado,
    texto: TEXTO_SEGMENTO[estado],
  }));
  /** El aviso de la campana sobre ingresos en cancha sin lote, con el texto del servidor. */
  protected readonly sinLote = computed(
    () => this.avisos.avisos().find((a) => a.tipo === 'SIN_LOTE') ?? null,
  );
  protected readonly minerales = signal<TipoMineral[]>([]);

  protected readonly listado = crearListadoPaginado<LoteFila, FiltroLotes>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    { estado: null, tipo_mineral: null, desde: '', hasta: '' },
  );

  ngOnInit(): void {
    this.listado.cargar();
    this.tiposMineral.listarVigentes().subscribe({ next: (lista) => this.minerales.set(lista) });
  }

  protected filtrarPorEstado(estado: EstadoLote | null): void {
    this.listado.filtrar({ estado });
  }

  protected filtrarPorMineral(tipo: number | null): void {
    this.listado.filtrar({ tipo_mineral: tipo });
  }

  protected filtrarPorFechas(cambios: Partial<Pick<FiltroLotes, 'desde' | 'hasta'>>): void {
    this.listado.filtrar(cambios);
  }
}
