import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

import { FiltroLotes, LoteFila, ResumenLote } from '@models/lote.model';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { LotesApiService } from '../../data-access/lotes-api.service';
import { TablaCierreComponent } from '../../ui/tabla-cierre/tabla-cierre.component';

const SOLO_EN_RECORRIDO: FiltroLotes = { estado: 'EN_RECORRIDO', tipo_mineral: null, desde: '', hasta: '' };

/**
 * Cierre de lotes, solo del Administrador (HU-M06-05 CA05): los lotes en recorrido y si están
 * listos para cerrar. La lista de lotes no trae sus pendientes, así que de cada fila de la
 * página (25 como máximo) se pide su resumen al servidor; el cliente no los deduce (D-F35).
 */
@Component({
  selector: 'app-cierre-lotes',
  standalone: true,
  imports: [EncabezadoPaginaComponent, MarcoListadoComponent, TablaCierreComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-encabezado-pagina
      titulo="Cierre de lotes"
      subtitulo="Lotes en recorrido y si están listos para cerrar con su destino"
    />
    <app-marco-listado
      [cargando]="listado.cargando()"
      [vacio]="listado.vacio()"
      [error]="listado.error()"
      [total]="listado.total()"
      [pagina]="listado.pagina()"
      mensajeVacio="No hay lotes en recorrido"
      iconoVacio="task_alt"
      (cambioPagina)="listado.irAPagina($event)"
    >
      <app-tabla-cierre [lotes]="listado.filas()" [resumenes]="resumenes()" />
    </app-marco-listado>
  `,
})
export class CierreLotesPage {
  private readonly api = inject(LotesApiService);

  protected readonly resumenes = signal<Readonly<Record<number, ResumenLote | null>>>({});
  protected readonly listado = crearListadoPaginado<LoteFila, FiltroLotes>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    SOLO_EN_RECORRIDO,
  );

  constructor() {
    this.listado.cargar();
    effect(() => {
      const filas = this.listado.filas();
      untracked(() => this.cargarResumenes(filas));
    });
  }

  private cargarResumenes(filas: readonly LoteFila[]): void {
    this.resumenes.set({});
    if (filas.length === 0) {
      return;
    }
    forkJoin(filas.map((fila) => this.api.resumen(fila.id).pipe(catchError(() => of(null))))).subscribe(
      (resumenes) => this.resumenes.set(Object.fromEntries(filas.map((fila, i) => [fila.id, resumenes[i]]))),
    );
  }
}
