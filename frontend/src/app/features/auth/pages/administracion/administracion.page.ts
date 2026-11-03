import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { Pestana, PestanasRutaComponent } from '@shared/components/pestanas-ruta/pestanas-ruta.component';

/** Administración: pestañas Usuarios, Permisos y Auditoría, como en la maqueta. */
@Component({
  selector: 'app-administracion',
  standalone: true,
  imports: [EncabezadoPaginaComponent, PestanasRutaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-encabezado-pagina titulo="Administración" subtitulo="Usuarios, roles y auditoría del sistema" />
    <app-pestanas-ruta [pestanas]="pestanas" etiqueta="Secciones de administración" />
  `,
})
export class AdministracionPage {
  protected readonly pestanas: readonly Pestana[] = [
    { ruta: 'usuarios', etiqueta: 'Usuarios' },
    { ruta: 'permisos', etiqueta: 'Permisos' },
    { ruta: 'auditoria', etiqueta: 'Auditoría' },
  ];
}
