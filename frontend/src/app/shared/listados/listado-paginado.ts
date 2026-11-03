import { DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

import { ErrorApi, esErrorApi } from '@models/error-api.model';
import { Pagina } from '@models/pagina.model';

export type CargadorPagina<T, F> = (filtro: F, pagina: number) => Observable<Pagina<T>>;

/**
 * Estado de un listado paginado del servidor: filtro, página, filas, carga y error. Una
 * consulta nueva cancela la anterior, así que una respuesta lenta nunca pisa a una reciente.
 *
 * Se crea con `crearListadoPaginado()` en el inicializador de un campo de la página.
 */
export class ListadoPaginado<T, F extends object> {
  readonly filtro: WritableSignal<F>;
  readonly pagina = signal(1);
  readonly datos = signal<Pagina<T> | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<ErrorApi | null>(null);

  readonly filas = computed(() => this.datos()?.results ?? []);
  readonly total = computed(() => this.datos()?.count ?? 0);
  readonly vacio = computed(() => this.datos() !== null && this.total() === 0);

  private consulta: Subscription | null = null;

  constructor(
    private readonly cargador: CargadorPagina<T, F>,
    filtroInicial: F,
    destroyRef?: DestroyRef,
  ) {
    this.filtro = signal<F>(filtroInicial);
    destroyRef?.onDestroy(() => this.consulta?.unsubscribe());
  }

  cargar(): void {
    this.consulta?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.consulta = this.cargador(this.filtro(), this.pagina()).subscribe({
      next: (pagina) => {
        this.datos.set(pagina);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(esErrorApi(error) ? error : null);
        this.cargando.set(false);
      },
    });
  }

  filtrar(cambios: Partial<F>): void {
    this.filtro.update((actual) => ({ ...actual, ...cambios }));
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(numero: number): void {
    this.pagina.set(numero);
    this.cargar();
  }
}

export function crearListadoPaginado<T, F extends object>(
  cargador: CargadorPagina<T, F>,
  filtroInicial: F,
): ListadoPaginado<T, F> {
  return new ListadoPaginado(cargador, filtroInicial, inject(DestroyRef));
}
