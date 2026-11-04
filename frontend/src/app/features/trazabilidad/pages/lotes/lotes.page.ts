import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { SiPuedeDirective } from '@core/autorizacion/si-puede.directive';
import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { ESTADOS_LOTE, ETIQUETA_ESTADO_LOTE, EstadoLote, FiltroLotes, LoteFila } from '@models/lote.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { LotesApiService } from '../../data-access/lotes-api.service';
import { TablaLotesComponent } from '../../ui/tabla-lotes/tabla-lotes.component';

/**
 * Lotes de proceso con filtros de estado, mineral y fechas (HU-M06-01). Los tres roles los
 * consultan; abrir un lote es de gestión. Un rango de fechas inverso lo rechaza el servidor
 * con su mensaje.
 */
@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
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
})
export class LotesPage implements OnInit {
  private readonly api = inject(LotesApiService);
  private readonly tiposMineral = inject(TiposMineralApiService);

  protected readonly estados = ESTADOS_LOTE;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO_LOTE;
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
