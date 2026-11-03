import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { FiltroTiposMineral, TipoMineral } from '@models/tipo-mineral.model';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { FiltroCatalogo } from '../../data-access/recurso-catalogo-api';
import { TiposMineralApiService } from '../../data-access/tipos-mineral-api.service';
import { DatosDialogoTipoMineral, DialogoTipoMineralComponent } from '../../ui/dialogos-catalogo.component';
import { TablaTiposMineralComponent } from '../../ui/tabla-tipos-mineral.component';
import { PaginaCatalogoBase, TextosCatalogo } from '../pagina-catalogo.base';

type FiltroPantallaTiposMineral = FiltroTiposMineral & FiltroCatalogo;

/** Catálogo de tipos de mineral (HU-M02-02). */
@Component({
  selector: 'app-tipos-mineral',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MarcoListadoComponent,
    TablaTiposMineralComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tipos-mineral.page.html',
})
export class TiposMineralPage extends PaginaCatalogoBase<TipoMineral, FiltroPantallaTiposMineral> {
  protected readonly api = inject(TiposMineralApiService);
  protected readonly textos: TextosCatalogo = {
    registrado: 'Tipo de mineral registrado',
    guardado: 'Tipo de mineral actualizado',
    desactivado: 'Tipo de mineral dado de baja',
    reactivado: 'Tipo de mineral reactivado',
  };
  protected readonly textoNuevo = 'Nuevo tipo de mineral';

  readonly listado = crearListadoPaginado<TipoMineral, FiltroPantallaTiposMineral>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    { incluir_inactivos: false },
  );

  crear(): void {
    this.abrirDialogo<DialogoTipoMineralComponent, DatosDialogoTipoMineral>(
      DialogoTipoMineralComponent,
      { titulo: this.textoNuevo, tipoMineral: null, guardar: (valor) => this.api.crear(valor) },
      this.textos.registrado,
    );
  }

  /** Solo el nombre se edita: el código no cambia (RN-M02-16). */
  editar(tipoMineral: TipoMineral): void {
    this.abrirDialogo<DialogoTipoMineralComponent, DatosDialogoTipoMineral>(
      DialogoTipoMineralComponent,
      {
        titulo: `Editar ${tipoMineral.nombre}`,
        tipoMineral,
        guardar: ({ nombre }) => this.api.editar(tipoMineral.id, { nombre }),
      },
      this.textos.guardado,
    );
  }

  protected nombrar(tipoMineral: TipoMineral): string {
    return `el tipo de mineral ${tipoMineral.nombre}`;
  }
}
