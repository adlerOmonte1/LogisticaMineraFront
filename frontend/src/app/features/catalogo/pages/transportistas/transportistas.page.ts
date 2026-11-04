import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Transportista } from '@models/transportista.model';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { cambiosRespectoDe } from '@shared/utils/cambios';
import { FiltroCatalogo } from '@core/catalogo/recurso-catalogo-api';
import { TransportistasApiService } from '@core/catalogo/transportistas-api.service';
import {
  DatosDialogoTransportista,
  DialogoTransportistaComponent,
} from '../../ui/dialogo-transportista.component';
import { TablaTransportistasComponent } from '../../ui/tabla-transportistas.component';
import { PaginaCatalogoBase, TextosCatalogo } from '../pagina-catalogo.base';

/** Catálogo de transportistas (HU-M02-03). */
@Component({
  selector: 'app-transportistas',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MarcoListadoComponent,
    TablaTransportistasComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transportistas.page.html',
})
export class TransportistasPage extends PaginaCatalogoBase<Transportista, FiltroCatalogo> {
  protected readonly api = inject(TransportistasApiService);
  protected readonly textos: TextosCatalogo = {
    registrado: 'Transportista registrado',
    guardado: 'Transportista actualizado',
    desactivado: 'Transportista dado de baja',
    reactivado: 'Transportista reactivado',
  };
  protected readonly textoNuevo = 'Nuevo transportista';

  readonly listado = crearListadoPaginado<Transportista, FiltroCatalogo>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    { incluir_inactivos: false },
  );

  crear(): void {
    this.abrirDialogo<DialogoTransportistaComponent, DatosDialogoTransportista>(
      DialogoTransportistaComponent,
      { titulo: this.textoNuevo, transportista: null, guardar: (alta) => this.api.crear(alta) },
      this.textos.registrado,
    );
  }

  editar(transportista: Transportista): void {
    this.abrirDialogo<DialogoTransportistaComponent, DatosDialogoTransportista>(
      DialogoTransportistaComponent,
      {
        titulo: `Editar ${transportista.razon_social}`,
        transportista,
        guardar: (valor) => this.api.editar(transportista.id, cambiosRespectoDe(transportista, valor)),
      },
      this.textos.guardado,
    );
  }

  protected nombrar(transportista: Transportista): string {
    return `al transportista ${transportista.razon_social}`;
  }
}
