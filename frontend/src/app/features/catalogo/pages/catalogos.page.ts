import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { Pestana, PestanasRutaComponent } from '@shared/components/pestanas-ruta/pestanas-ruta.component';

/** Catálogos maestros (M02): vehículos, tipos de mineral y transportistas. */
@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [EncabezadoPaginaComponent, PestanasRutaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-encabezado-pagina titulo="Catálogos" subtitulo="Vehículos, tipos de mineral y transportistas" />
    <app-pestanas-ruta [pestanas]="pestanas" etiqueta="Catálogos" />
  `,
})
export class CatalogosPage {
  protected readonly pestanas: readonly Pestana[] = [
    { ruta: 'vehiculos', etiqueta: 'Vehículos' },
    { ruta: 'tipos-mineral', etiqueta: 'Tipos de mineral' },
    { ruta: 'transportistas', etiqueta: 'Transportistas' },
  ];
}
