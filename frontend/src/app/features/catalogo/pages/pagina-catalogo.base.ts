import { Directive, OnInit, inject } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { EMPTY, Observable, filter, switchMap } from 'rxjs';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { ConMensaje } from '@models/pagina.model';
import { ListadoPaginado } from '@shared/listados/listado-paginado';
import { EstadoCatalogoApi, FiltroCatalogo, RegistroCatalogo } from '../data-access/recurso-catalogo-api';

/** Textos de la interfaz propios de cada catálogo. */
export interface TextosCatalogo {
  registrado: string;
  guardado: string;
  desactivado: string;
  reactivado: string;
}

/**
 * Comportamiento común de las tres pantallas del catálogo: carga paginada, «mostrar
 * inactivos», alta y edición en diálogo, baja lógica y reactivación con confirmación. Cada
 * página aporta su API, su listado y cómo nombrar un registro (plantilla, D-07).
 *
 * Los mensajes del servidor (baja con registros asociados, reactivación) se muestran tal cual;
 * cuando el servidor no manda uno, se usa el texto de la interfaz de `TextosCatalogo`.
 */
@Directive()
export abstract class PaginaCatalogoBase<TRecurso extends RegistroCatalogo, TFiltro extends FiltroCatalogo>
  implements OnInit
{
  protected readonly dialogos = inject(DialogosService);
  protected readonly notificacion = inject(NotificacionService);

  protected abstract readonly api: EstadoCatalogoApi<TRecurso>;
  protected abstract readonly textos: TextosCatalogo;
  abstract readonly listado: ListadoPaginado<TRecurso, TFiltro>;

  /** Cómo se menciona un registro en una confirmación: «el vehículo ABC-123». */
  protected abstract nombrar(recurso: TRecurso): string;

  ngOnInit(): void {
    this.listado.cargar();
  }

  mostrarInactivos(incluir: boolean): void {
    this.listado.filtrar({ incluir_inactivos: incluir } as Partial<TFiltro>);
  }

  desactivar(recurso: TRecurso): void {
    this.confirmarYEjecutar(
      {
        titulo: `¿Dar de baja ${this.nombrar(recurso)}?`,
        mensaje: 'Se desactiva y deja de ofrecerse; nunca se elimina y sus registros se conservan.',
        textoConfirmar: 'Dar de baja',
        advertencia: true,
      },
      () => this.api.desactivar(recurso.id),
      this.textos.desactivado,
    );
  }

  reactivar(recurso: TRecurso): void {
    this.confirmarYEjecutar(
      {
        titulo: `¿Reactivar ${this.nombrar(recurso)}?`,
        mensaje: 'Vuelve a ofrecerse en el registro de ingresos.',
        textoConfirmar: 'Reactivar',
      },
      () => this.api.reactivar(recurso.id),
      this.textos.reactivado,
    );
  }

  /** Abre un diálogo de alta o edición; si se guarda, avisa y recarga la lista. */
  protected abrirDialogo<C, D>(componente: ComponentType<C>, datos: D, textoExito: string): void {
    this.dialogos
      .abrir<C, D, TRecurso>(componente, datos)
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.notificacion.exito(textoExito);
        this.listado.cargar();
      });
  }

  private confirmarYEjecutar(
    confirmacion: Parameters<DialogosService['confirmar']>[0],
    accion: () => Observable<ConMensaje<TRecurso>>,
    textoPorDefecto: string,
  ): void {
    this.dialogos
      .confirmar(confirmacion)
      .pipe(switchMap((confirmado) => (confirmado ? accion() : EMPTY)))
      .subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje || textoPorDefecto);
          this.listado.cargar();
        },
        error: (error: unknown) => this.notificacion.rechazo(error),
      });
  }
}
