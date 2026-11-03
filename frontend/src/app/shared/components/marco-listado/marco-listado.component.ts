import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ErrorApi } from '@models/error-api.model';
import { TAMANO_PAGINA_API } from '@models/pagina.model';
import { AvisoErrorComponent } from '../aviso-error/aviso-error.component';
import { EstadoVacioComponent } from '../estado-vacio/estado-vacio.component';

/**
 * Marco común de un listado paginado del servidor: barra de filtros (`[filtros]`), error,
 * progreso, estado vacío, la tabla (contenido) y el paginador de 25 por página.
 */
@Component({
  selector: 'app-marco-listado',
  standalone: true,
  imports: [MatPaginatorModule, MatProgressBarModule, AvisoErrorComponent, EstadoVacioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filtros"><ng-content select="[filtros]" /></div>
    <app-aviso-error [error]="error()" />
    <section class="tarjeta tarjeta--plana" [attr.aria-busy]="cargando()">
      @if (cargando()) {
        <mat-progress-bar mode="indeterminate" />
      }
      @if (vacio()) {
        <app-estado-vacio [icono]="iconoVacio()" [mensaje]="mensajeVacio()" />
      } @else {
        <ng-content />
      }
      <mat-paginator
        [length]="total()"
        [pageSize]="tamanoPagina"
        [pageIndex]="pagina() - 1"
        [hidePageSize]="true"
        (page)="cambiarPagina($event)"
      />
    </section>
  `,
})
export class MarcoListadoComponent {
  readonly cargando = input(false);
  readonly vacio = input(false);
  readonly error = input<ErrorApi | null>(null);
  readonly total = input(0);
  readonly pagina = input(1);
  readonly mensajeVacio = input('No hay registros con estos filtros');
  readonly iconoVacio = input('inbox');

  readonly cambioPagina = output<number>();

  protected readonly tamanoPagina = TAMANO_PAGINA_API;

  protected cambiarPagina({ pageIndex }: PageEvent): void {
    this.cambioPagina.emit(pageIndex + 1);
  }
}
