import { ComponentType } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { EMPTY, Observable, filter, switchMap } from 'rxjs';

import { AutorizacionService } from '@core/autorizacion/autorizacion.service';
import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { DialogosService } from '@core/dialogos/dialogos.service';
import { comoErrorApi } from '@core/errores/error-inesperado';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { ErrorApi, esErrorApi } from '@models/error-api.model';
import {
  CatalogoRecorrido,
  ComposicionMineral,
  IngresoDeComposicion,
  Lote,
  RespuestaEtapa,
  RespuestaLote,
  SiguientePaso,
} from '@models/lote.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { InsigniaEstadoComponent } from '@shared/components/insignia-estado/insignia-estado.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { PresentacionEstado, presentarEstadoLote } from '@shared/utils/presentacion-lote';
import { CatalogoRecorridoApiService } from '../../data-access/catalogo-recorrido-api.service';
import { LotesApiService } from '../../data-access/lotes-api.service';
import { ComposicionLoteComponent } from '../../ui/composicion-lote/composicion-lote.component';
import {
  DatosDialogoAsignar,
  DialogoAsignarComponent,
} from '../../ui/dialogo-asignar/dialogo-asignar.component';
import {
  DatosDialogoBigbags,
  DialogoBigbagsComponent,
} from '../../ui/dialogo-bigbags/dialogo-bigbags.component';
import {
  DatosDialogoDivision,
  DialogoDivisionComponent,
} from '../../ui/dialogo-division/dialogo-division.component';
import { DatosDialogoEtapa, DialogoEtapaComponent } from '../../ui/dialogo-etapa/dialogo-etapa.component';
import {
  DatosDialogoMineral,
  DialogoMineralComponent,
} from '../../ui/dialogo-mineral/dialogo-mineral.component';
import { PartesLoteComponent } from '../../ui/partes-lote/partes-lote.component';
import { RecorridoLoteComponent } from '../../ui/recorrido-lote/recorrido-lote.component';
import { SiguientePasoComponent } from '../../ui/siguiente-paso/siguiente-paso.component';

function esRespuestaEtapa(respuesta: RespuestaLote): respuesta is RespuestaEtapa {
  return 'paso' in respuesta;
}

/**
 * Detalle de un lote: estado, composición con sus tardíos, partes, recorrido, bigbags y el
 * «Siguiente paso». Es la pantalla del Supervisor en planta: registrar una etapa son dos o tres
 * toques (RNF-M06-06). Lo que se ofrece registrar lo dice `siguientes` (RNF-M06-07); las
 * acciones de composición son de gestión y desaparecen con el lote cerrado (HU-M06-05 CA07). Lo
 * que el servidor rechaza se muestra con su mensaje literal.
 */
@Component({
  selector: 'app-lote-detalle',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    InsigniaEstadoComponent,
    FechaLimaPipe,
    ComposicionLoteComponent,
    PartesLoteComponent,
    RecorridoLoteComponent,
    SiguientePasoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lote-detalle.page.html',
  styleUrl: './lote-detalle.page.scss',
})
export class LoteDetallePage {
  readonly id = input.required<string>();

  private readonly api = inject(LotesApiService);
  private readonly catalogoApi = inject(CatalogoRecorridoApiService);
  private readonly tiposMineral = inject(TiposMineralApiService);
  private readonly dialogos = inject(DialogosService);
  private readonly notificacion = inject(NotificacionService);
  private readonly autorizacion = inject(AutorizacionService);

  protected readonly lote = signal<Lote | null>(null);
  protected readonly catalogo = signal<CatalogoRecorrido | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<ErrorApi | null>(null);
  /** Rendimiento de la última molienda registrada, tal como lo calculó el servidor. */
  protected readonly rendimiento = signal<string | null>(null);

  protected readonly estado = computed<PresentacionEstado | null>(() => {
    const lote = this.lote();
    return lote ? presentarEstadoLote(lote.estado) : null;
  });

  private readonly noCerrado = computed(() => this.lote()?.estado !== 'CERRADO');
  protected readonly puedeComponer = computed(
    () => this.noCerrado() && this.autorizacion.puede('COMPONER_LOTE'),
  );
  protected readonly puedeIniciar = computed(() => this.puedeComponer() && this.lote()?.estado === 'ABIERTO');
  /** Dividir se ofrece una vez, con el lote en recorrido y sin partes (HU-M06-04 CA06). */
  protected readonly puedeDividir = computed(() => {
    const lote = this.lote();
    return this.puedeComponer() && lote?.estado === 'EN_RECORRIDO' && lote.partes.length === 0;
  });
  protected readonly puedeCerrar = computed(
    () => this.lote()?.estado === 'EN_RECORRIDO' && this.autorizacion.puede('CERRAR_LOTE'),
  );
  /** Los bigbags se asocian al ensacado: la acción aparece cuando ya hay uno (HU-M06-02 CA13). */
  protected readonly puedeAsociarBigbags = computed(
    () =>
      this.noCerrado() &&
      this.autorizacion.puede('REGISTRAR_ETAPA') &&
      (this.lote()?.recorrido.some((paso) => paso.etapa === 'ENSACADO') ?? false),
  );

  constructor() {
    this.catalogoApi.catalogo().subscribe({ next: (catalogo) => this.catalogo.set(catalogo) });
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
  }

  protected nombreRuta(lote: Lote): string {
    const ruta = this.catalogo()?.rutas.find((r) => r.codigo === lote.ruta);
    return ruta?.nombre ?? '';
  }

  /* Composición (gestión) */

  protected agregarMineral(): void {
    const lote = this.lote();
    if (!lote) {
      return;
    }
    this.tiposMineral.listarVigentes().subscribe({
      next: (minerales) =>
        this.abrir<DialogoMineralComponent, DatosDialogoMineral>(DialogoMineralComponent, {
          titulo: 'Agregar otro mineral',
          minerales,
          guardar: (tipo) => this.api.agregarMineral(lote.id, tipo),
        }),
      error: (error: unknown) => this.notificacion.rechazo(error),
    });
  }

  protected quitarMineral(grupo: ComposicionMineral): void {
    const lote = this.lote();
    if (lote) {
      this.confirmar(
        `¿Quitar ${grupo.tipo_mineral.nombre} del lote?`,
        'El mineral deja de ser parte de la composición del lote.',
        'Quitar',
        () => this.api.quitarMineral(lote.id, grupo.tipo_mineral.id),
      );
    }
  }

  protected asignar(): void {
    const lote = this.lote();
    if (!lote) {
      return;
    }
    this.api.disponibles(lote.id).subscribe({
      next: (disponibles) =>
        this.abrir<DialogoAsignarComponent, DatosDialogoAsignar>(DialogoAsignarComponent, {
          titulo: 'Asignar ingresos',
          disponibles,
          guardar: (cuerpo) => this.api.asignar(lote.id, cuerpo),
        }),
      error: (error: unknown) => this.notificacion.rechazo(error),
    });
  }

  protected retirar(ingreso: IngresoDeComposicion): void {
    const lote = this.lote();
    if (lote) {
      this.confirmar(
        `¿Retirar ${ingreso.codigo} del lote?`,
        'El ingreso vuelve a cancha y los totales se recalculan.',
        'Retirar',
        () => this.api.retirar(lote.id, ingreso.id),
      );
    }
  }

  protected iniciarRecorrido(): void {
    const lote = this.lote();
    if (lote) {
      this.confirmar(
        `¿Iniciar el recorrido de ${lote.nombre}?`,
        'Desde ahí se registra el paso por las etapas.',
        'Iniciar recorrido',
        () => this.api.iniciarRecorrido(lote.id),
        false,
      );
    }
  }

  protected dividir(): void {
    const lote = this.lote();
    const catalogo = this.catalogo();
    if (lote && catalogo) {
      this.abrir<DialogoDivisionComponent, DatosDialogoDivision>(DialogoDivisionComponent, {
        titulo: 'Dividir el lote',
        rutas: catalogo.rutas,
        guardar: (partes) => this.api.dividir(lote.id, partes),
      });
    }
  }

  /* Recorrido (todos los roles) */

  protected registrar(siguiente: SiguientePaso): void {
    const lote = this.lote();
    const catalogo = this.catalogo();
    if (!lote || !catalogo) {
      return;
    }
    const nombreEtapa = catalogo.etapas.find((e) => e.codigo === siguiente.etapa)?.nombre ?? '';
    const idIngreso = siguiente.ingreso;
    const esSecadoPropio = idIngreso !== null && siguiente.etapa === 'SECADO';
    this.abrir<DialogoEtapaComponent, DatosDialogoEtapa>(DialogoEtapaComponent, {
      titulo: siguiente.elegir_ruta ? 'Elegir la ruta' : `Registrar ${nombreEtapa.toLowerCase()}`,
      siguiente,
      nombreEtapa,
      rutas: catalogo.rutas,
      partes: lote.partes,
      guardar: (valor) =>
        esSecadoPropio
          ? this.api.secadoPropio(lote.id, idIngreso, {
              fecha_hora: valor.fecha_hora,
              observacion: valor.observacion,
              fracciones: valor.fracciones,
            })
          : this.api.registrarEtapa(lote.id, {
              etapa: siguiente.elegir_ruta ? null : siguiente.etapa,
              ruta: valor.ruta,
              parte: siguiente.parte,
              ingreso: idIngreso,
              fecha_hora: valor.fecha_hora,
              horas_molienda: valor.horas_molienda,
              observacion: valor.observacion,
              bigbags: valor.bigbags,
            }),
    });
  }

  protected asociarBigbags(): void {
    const lote = this.lote();
    if (lote) {
      this.abrir<DialogoBigbagsComponent, DatosDialogoBigbags>(DialogoBigbagsComponent, {
        titulo: 'Asociar bigbags',
        partes: lote.partes,
        guardar: (cuerpo) => this.api.bigbags(lote.id, cuerpo),
      });
    }
  }

  /* Soporte */

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.lote.set(null);
    this.rendimiento.set(null);
    this.api.obtener(id).subscribe({
      next: (lote) => {
        this.lote.set(lote);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(comoErrorApi(error));
        this.cargando.set(false);
      },
    });
  }

  /** Abre un diálogo de envío y, si se guardó, refleja el lote que devolvió el servidor. */
  private abrir<C, D>(componente: ComponentType<C>, datos: D): void {
    this.dialogos
      .abrir<C, D, RespuestaLote>(componente, datos)
      .pipe(filter((respuesta): respuesta is RespuestaLote => respuesta !== undefined))
      .subscribe((respuesta) => this.aplicar(respuesta));
  }

  private aplicar(respuesta: RespuestaLote): void {
    this.lote.set(respuesta);
    this.rendimiento.set(
      esRespuestaEtapa(respuesta) && respuesta.paso.toneladas_por_hora
        ? `Rendimiento de la molienda: ${respuesta.paso.toneladas_por_hora} t/h (estimado)`
        : null,
    );
    if (respuesta.mensaje) {
      this.notificacion.exito(respuesta.mensaje);
    }
  }

  private confirmar(
    titulo: string,
    mensaje: string,
    textoConfirmar: string,
    accion: () => Observable<RespuestaLote>,
    advertencia = true,
  ): void {
    this.dialogos
      .confirmar({ titulo, mensaje, textoConfirmar, advertencia })
      .pipe(switchMap((confirmado) => (confirmado ? accion() : EMPTY)))
      .subscribe({
        next: (respuesta) => this.aplicar(respuesta),
        error: (error: unknown) => {
          this.notificacion.rechazo(error);
          // Un conflicto (409) quiere decir que el lote cambió: se vuelve a leer.
          if (esErrorApi(error) && error.status === 409) {
            this.cargar(Number(this.id()));
          }
        },
      });
  }
}
