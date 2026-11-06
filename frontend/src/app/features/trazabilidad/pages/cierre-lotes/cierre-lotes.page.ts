import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, forkJoin, of } from 'rxjs';

import { FiltroLotes, LoteFila, ResumenLote } from '@models/lote.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { MarcoListadoComponent } from '@shared/components/marco-listado/marco-listado.component';
import { crearListadoPaginado } from '@shared/listados/listado-paginado';
import { LotesApiService } from '../../data-access/lotes-api.service';
import { TablaCierreComponent } from '../../ui/tabla-cierre/tabla-cierre.component';

const EN_RECORRIDO: FiltroLotes = { estado: 'EN_RECORRIDO', tipo_mineral: null, desde: '', hasta: '' };
const CERRADOS: FiltroLotes = { estado: 'CERRADO', tipo_mineral: null, desde: '', hasta: '' };

/**
 * Cierre de lotes, solo del Administrador (HU-M06-05 CA05), con las tres secciones de la maqueta
 * (`pAltas`, D-F45): listos para cerrar, en proceso con lo primero que falta, y cerrados con su
 * destino. La lista de lotes no trae pendientes ni bigbags, así que de cada fila de la página se
 * pide su resumen al servidor; el cliente no los deduce (D-F35).
 */
@Component({
  selector: 'app-cierre-lotes',
  standalone: true,
  imports: [
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    MarcoListadoComponent,
    TablaCierreComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-encabezado-pagina
      titulo="Cierre de lotes"
      subtitulo="Salida del mineral: los lotes terminados se cierran con su destino, venta o traslado, y el resumen de su proceso"
    />
    <div class="lm-pila">
      <h2 class="lm-seccion">Listos para cerrar</h2>
      @if (enRecorrido.cargando()) {
        <mat-progress-bar mode="indeterminate" />
      }
      <app-aviso-error [error]="enRecorrido.error()" />
      @if (listos().length > 0) {
        <div class="lm-card lm-card--plana" data-prueba="seccion-listos">
          <app-tabla-cierre [lotes]="listos()" [resumenes]="resumenes()" modo="listos" />
        </div>
      } @else {
        <div class="lm-card">
          <p class="lm-small lm-muted sin-margen">
            {{
              calculando()
                ? 'Revisando los lotes en recorrido…'
                : 'No hay lotes con todo su mineral ensacado.'
            }}
          </p>
        </div>
      }

      <h2 class="lm-seccion">En proceso</h2>
      @if (enProceso().length > 0) {
        <div class="lm-card lm-card--plana" data-prueba="seccion-proceso">
          <app-tabla-cierre [lotes]="enProceso()" [resumenes]="resumenes()" modo="proceso" />
        </div>
      } @else {
        <div class="lm-card"><p class="lm-small lm-muted sin-margen">No hay lotes en proceso.</p></div>
      }

      <h2 class="lm-seccion">Cerrados</h2>
      <app-marco-listado
        [cargando]="cerrados.cargando()"
        [vacio]="cerrados.vacio()"
        [error]="cerrados.error()"
        [total]="cerrados.total()"
        [pagina]="cerrados.pagina()"
        mensajeVacio="Aún no se ha cerrado ningún lote."
        iconoVacio="task_alt"
        (cambioPagina)="cerrados.irAPagina($event)"
      >
        <app-tabla-cierre [lotes]="cerrados.filas()" [resumenes]="resumenes()" modo="cerrados" />
      </app-marco-listado>
    </div>
  `,
  styles: `
    .sin-margen {
      margin: 0;
    }
  `,
})
export class CierreLotesPage {
  private readonly api = inject(LotesApiService);

  protected readonly resumenes = signal<Readonly<Record<number, ResumenLote | null>>>({});
  protected readonly enRecorrido = crearListadoPaginado<LoteFila, FiltroLotes>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    EN_RECORRIDO,
  );
  protected readonly cerrados = crearListadoPaginado<LoteFila, FiltroLotes>(
    (filtro, pagina) => this.api.listar(filtro, pagina),
    CERRADOS,
  );

  /** Un lote está listo si el servidor no le marca pendientes; mientras no llega, va en proceso. */
  protected readonly listos = computed(() =>
    this.enRecorrido.filas().filter((l) => this.resumenes()[l.id]?.pendientes.length === 0),
  );
  protected readonly enProceso = computed(() =>
    this.enRecorrido.filas().filter((l) => this.resumenes()[l.id]?.pendientes.length !== 0),
  );
  protected readonly calculando = computed(() =>
    this.enRecorrido.filas().some((l) => this.resumenes()[l.id] === undefined),
  );

  constructor() {
    this.enRecorrido.cargar();
    this.cerrados.cargar();
    effect(() => {
      const filas = [...this.enRecorrido.filas(), ...this.cerrados.filas()];
      untracked(() => this.cargarResumenes(filas));
    });
  }

  private cargarResumenes(filas: readonly LoteFila[]): void {
    const faltan = filas.filter((fila) => !(fila.id in this.resumenes()));
    if (faltan.length === 0) {
      return;
    }
    forkJoin(faltan.map((fila) => this.api.resumen(fila.id).pipe(catchError(() => of(null))))).subscribe(
      (resumenes) =>
        this.resumenes.update((previos) => ({
          ...previos,
          ...Object.fromEntries(faltan.map((fila, i) => [fila.id, resumenes[i]])),
        })),
    );
  }
}
