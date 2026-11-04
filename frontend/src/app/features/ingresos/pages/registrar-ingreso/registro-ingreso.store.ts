import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
} from 'rxjs';

import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { VehiculosApiService } from '@core/catalogo/vehiculos-api.service';
import { comoErrorApi } from '@core/errores/error-inesperado';
import { SesionService } from '@core/sesion/sesion.service';
import { ErrorApi } from '@models/error-api.model';
import { Ingreso, MotivoSinFoto } from '@models/ingreso.model';
import { ConMensaje } from '@models/pagina.model';
import {
  BorradorIngreso,
  CamposRegistro,
  ConsultaVehiculo,
  JustificacionesPorRegla,
  PasoRegistro,
  VehiculoBreve,
} from '@models/registro-ingreso.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { normalizarDecimal } from '@shared/formularios/validadores';
import { reducirImagen } from '@shared/utils/reducir-imagen';
import { normalizarPlaca } from '@shared/utils/placa';
import { BorradorLocal, BorradorLocalService } from '../../data-access/borrador-local.service';
import { IngresosApiService } from '../../data-access/ingresos-api.service';

const ESPERA_CONSULTA_PLACA_MS = 350;

export const CAMPOS_VACIOS: CamposRegistro = {
  placa: '',
  fecha: '',
  hora: '',
  peso_bruto_tn: '',
  tipo_mineral: null,
};

/**
 * Estado y orquestación del registro de un ingreso (HU-M03-01): captura → revisión →
 * confirmación. Se provee a nivel de la página, así cada visita empieza limpia.
 *
 * No toca el DOM ni los formularios: la página le pasa lo que el usuario edita y lee de aquí lo
 * que debe pintar. Nada se persiste en el servidor hasta `confirmar()` (D-13); lo único que se
 * guarda antes es el borrador local, para no perder el trabajo si se corta la señal (D-F15).
 */
@Injectable()
export class RegistroIngresoStore {
  private readonly api = inject(IngresosApiService);
  private readonly borradorLocal = inject(BorradorLocalService);
  private readonly tiposMineralApi = inject(TiposMineralApiService);
  private readonly vehiculosApi = inject(VehiculosApiService);
  private readonly sesion = inject(SesionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly paso = signal<PasoRegistro>('captura');
  readonly procesando = signal(false);
  readonly errorCaptura = signal<ErrorApi | null>(null);
  readonly propuesta = signal<BorradorIngreso | null>(null);
  readonly imagen = signal<Blob | null>(null);
  readonly imagenUrl = signal<string | null>(null);
  readonly consultaVehiculo = signal<ConsultaVehiculo | null>(null);
  readonly tiposMineral = signal<TipoMineral[]>([]);
  readonly errorCatalogo = signal<ErrorApi | null>(null);
  readonly confirmando = signal(false);
  readonly errorConfirmacion = signal<ErrorApi | null>(null);
  readonly registrado = signal<ConMensaje<Ingreso> | null>(null);
  /** Un registro en curso que se encontró al abrir la pantalla: se ofrece continuar o descartar. */
  readonly pendiente = signal<BorradorLocal | null>(null);

  private readonly recuperados = signal<{
    campos: CamposRegistro;
    justificaciones: JustificacionesPorRegla;
  } | null>(null);
  private motivoSinFoto: MotivoSinFoto | null = null;
  private ultimosCampos: CamposRegistro | null = null;
  private ultimasJustificaciones: JustificacionesPorRegla = {};
  private urlObjeto: string | null = null;
  private readonly placaEscrita$ = new Subject<string>();
  private readonly vehiculosCreados = new Map<string, VehiculoBreve>();

  /** Lo que se precarga en el formulario al entrar a la revisión (lo recuperado, o lo reconocido). */
  readonly camposIniciales = computed<CamposRegistro>(() => {
    const recuperados = this.recuperados();
    const propuesta = this.propuesta();
    if (recuperados) {
      return recuperados.campos;
    }
    return propuesta
      ? {
          placa: propuesta.propuesta.placa ?? '',
          fecha: propuesta.propuesta.fecha ?? '',
          hora: propuesta.propuesta.hora,
          peso_bruto_tn: propuesta.propuesta.peso_bruto_tn ?? '',
          tipo_mineral: null,
        }
      : CAMPOS_VACIOS;
  });
  readonly justificacionesIniciales = computed(() => this.recuperados()?.justificaciones ?? {});

  constructor() {
    this.placaEscrita$
      .pipe(
        debounceTime(ESPERA_CONSULTA_PLACA_MS),
        distinctUntilChanged(),
        switchMap((placa) => this.consultarVehiculo(placa)),
        takeUntilDestroyed(),
      )
      .subscribe((consulta) => this.consultaVehiculo.set(consulta));
    this.destroyRef.onDestroy(() => this.liberarUrl());
  }

  /** Carga los tipos de mineral y busca un registro en curso de este usuario. */
  async iniciar(): Promise<void> {
    this.cargarTiposMineral();
    const usuario = this.sesion.usuario();
    if (usuario) {
      this.pendiente.set(await this.borradorLocal.leer(usuario.id));
    }
  }

  // ---- 1. Captura ---------------------------------------------------------------------

  async capturar(archivo: Blob): Promise<void> {
    this.procesando.set(true);
    this.errorCaptura.set(null);
    this.pendiente.set(null);
    const reducida = await reducirImagen(archivo);
    this.fijarImagen(reducida);
    this.motivoSinFoto = null;
    await this.guardarLocal('captura', null);
    this.enviarImagen(reducida);
  }

  /** Reenvía la imagen guardada: la imagen no se pierde si el envío falló (RNF-M03-05). */
  reintentarCaptura(): void {
    const imagen = this.imagen();
    if (imagen) {
      this.procesando.set(true);
      this.errorCaptura.set(null);
      this.enviarImagen(imagen);
    }
  }

  capturarSinFoto(motivo: MotivoSinFoto): void {
    this.procesando.set(true);
    this.errorCaptura.set(null);
    this.pendiente.set(null);
    this.motivoSinFoto = motivo;
    this.fijarImagen(null);
    this.api
      .iniciarBorradorSinFoto(motivo)
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: (borrador) => this.aceptarPropuesta(borrador),
        error: (error: unknown) => this.errorCaptura.set(comoErrorApi(error)),
      });
  }

  // ---- Registro en curso --------------------------------------------------------------

  continuarPendiente(): void {
    const borrador = this.pendiente();
    if (!borrador) {
      return;
    }
    this.pendiente.set(null);
    this.fijarImagen(borrador.imagen);
    this.motivoSinFoto = borrador.sinFoto;
    if (!borrador.propuesta) {
      return;
    }
    this.recuperados.set(
      borrador.campos ? { campos: borrador.campos, justificaciones: borrador.justificaciones } : null,
    );
    this.propuesta.set(borrador.propuesta);
    this.consultaVehiculo.set(consultaInicial(borrador.propuesta, borrador.campos?.placa));
    this.paso.set('revision');
  }

  descartarPendiente(): void {
    this.pendiente.set(null);
    void this.borradorLocal.descartar();
  }

  // ---- 2. Revisión --------------------------------------------------------------------

  /** Guarda lo que el usuario edita; la página lo llama con una espera entre cambios. */
  recordarCampos(campos: CamposRegistro, justificaciones: JustificacionesPorRegla): void {
    this.ultimosCampos = campos;
    this.ultimasJustificaciones = justificaciones;
    void this.guardarLocal('revision', campos);
  }

  placaEscrita(placa: string): void {
    this.placaEscrita$.next(normalizarPlaca(placa));
  }

  /** El vehículo se dio de alta desde la revisión: el registro continúa con todo lo capturado. */
  vehiculoCreado(vehiculo: VehiculoBreve): void {
    this.vehiculosCreados.set(vehiculo.placa, vehiculo);
    this.consultaVehiculo.set({ placa: vehiculo.placa, vehiculo });
  }

  /** El tipo de mineral se creó desde la revisión: se recarga la lista para ofrecerlo. */
  tipoMineralCreado(): void {
    this.cargarTiposMineral();
  }

  confirmar(campos: CamposRegistro, justificaciones: JustificacionesPorRegla): void {
    const propuesta = this.propuesta();
    if (!propuesta) {
      return;
    }
    this.confirmando.set(true);
    this.errorConfirmacion.set(null);
    this.api
      .registrar({
        borrador: propuesta.borrador,
        placa: normalizarPlaca(campos.placa),
        fecha: campos.fecha,
        hora: campos.hora,
        peso_bruto_tn: normalizarDecimal(campos.peso_bruto_tn),
        tipo_mineral: campos.tipo_mineral,
        justificaciones: conTexto(justificaciones),
      })
      .pipe(finalize(() => this.confirmando.set(false)))
      .subscribe({
        next: (ingreso) => this.terminar(ingreso),
        error: (error: unknown) => this.rechazar(comoErrorApi(error)),
      });
  }

  // ---- 3. Salida ----------------------------------------------------------------------

  /** Empieza de cero: otro ticket, o volver a fotografiar. Descarta el registro en curso. */
  nuevo(): void {
    this.paso.set('captura');
    this.procesando.set(false);
    this.errorCaptura.set(null);
    this.propuesta.set(null);
    this.recuperados.set(null);
    this.consultaVehiculo.set(null);
    this.errorConfirmacion.set(null);
    this.registrado.set(null);
    this.pendiente.set(null);
    this.motivoSinFoto = null;
    this.ultimosCampos = null;
    this.ultimasJustificaciones = {};
    this.vehiculosCreados.clear();
    this.fijarImagen(null);
    void this.borradorLocal.descartar();
  }

  // ---- Internos -----------------------------------------------------------------------

  private enviarImagen(imagen: Blob): void {
    this.api
      .iniciarBorrador(imagen)
      .pipe(finalize(() => this.procesando.set(false)))
      .subscribe({
        next: (borrador) => this.aceptarPropuesta(borrador),
        error: (error: unknown) => this.errorCaptura.set(comoErrorApi(error)),
      });
  }

  private aceptarPropuesta(borrador: BorradorIngreso): void {
    this.recuperados.set(null);
    this.propuesta.set(borrador);
    this.consultaVehiculo.set(consultaInicial(borrador));
    this.paso.set('revision');
    this.ultimosCampos = this.camposIniciales();
    this.ultimasJustificaciones = {};
    void this.guardarLocal('revision', this.ultimosCampos);
  }

  private terminar(ingreso: ConMensaje<Ingreso>): void {
    this.registrado.set(ingreso);
    this.paso.set('confirmado');
    this.fijarImagen(null);
    void this.borradorLocal.descartar();
  }

  /** Un borrador ya registrado no se puede reintentar: se descarta el local (D-25). */
  private rechazar(error: ErrorApi): void {
    this.errorConfirmacion.set(error);
    if (error.codigo === CODIGO_BORRADOR_REGISTRADO) {
      void this.borradorLocal.descartar();
    }
  }

  private consultarVehiculo(placa: string): Observable<ConsultaVehiculo> {
    const propuesta = this.propuesta();
    const creado = this.vehiculosCreados.get(placa);
    if (!placa) {
      return of({ placa, vehiculo: null });
    }
    if (creado) {
      return of({ placa, vehiculo: creado });
    }
    // Lo que el servidor ya dijo de la placa reconocida no se vuelve a preguntar.
    if (propuesta && normalizarPlaca(propuesta.propuesta.placa ?? '') === placa) {
      return of({ placa, vehiculo: propuesta.vehiculo });
    }
    return this.vehiculosApi.listar({ placa, incluir_inactivos: true }).pipe(
      map((pagina) => ({ placa, vehiculo: pagina.results[0] ?? null })),
      catchError(() => (this.procesando() ? EMPTY : of({ placa, vehiculo: null, fallo: true }))),
    );
  }

  private cargarTiposMineral(): void {
    this.tiposMineralApi.listarVigentes().subscribe({
      next: (tipos) => {
        this.errorCatalogo.set(null);
        this.tiposMineral.set(tipos);
      },
      error: (error: unknown) => this.errorCatalogo.set(comoErrorApi(error)),
    });
  }

  private async guardarLocal(paso: BorradorLocal['paso'], campos: CamposRegistro | null): Promise<void> {
    const usuario = this.sesion.usuario();
    if (!usuario) {
      return;
    }
    await this.borradorLocal.guardar({
      usuarioId: usuario.id,
      paso,
      imagen: this.imagen(),
      sinFoto: this.motivoSinFoto,
      propuesta: this.propuesta(),
      campos: campos ?? this.ultimosCampos,
      justificaciones: this.ultimasJustificaciones,
      actualizado: new Date().toISOString(),
    });
  }

  private fijarImagen(imagen: Blob | null): void {
    this.liberarUrl();
    this.urlObjeto = imagen ? URL.createObjectURL(imagen) : null;
    this.imagen.set(imagen);
    this.imagenUrl.set(this.urlObjeto);
  }

  private liberarUrl(): void {
    if (this.urlObjeto) {
      URL.revokeObjectURL(this.urlObjeto);
      this.urlObjeto = null;
    }
  }
}

export const CODIGO_BORRADOR_REGISTRADO = 'BORRADOR_REGISTRADO';

/**
 * Lo que el servidor ya dijo del vehículo de la placa reconocida. Si el usuario había cambiado
 * la placa antes de recuperar el borrador, ese dato no vale: se vuelve a consultar el catálogo.
 */
function consultaInicial(borrador: BorradorIngreso, placaEditada?: string): ConsultaVehiculo | null {
  const reconocida = normalizarPlaca(borrador.propuesta.placa ?? '');
  const placa = placaEditada === undefined ? reconocida : normalizarPlaca(placaEditada);
  return placa && placa === reconocida ? { placa, vehiculo: borrador.vehiculo } : null;
}

/** El servidor reclama una justificación solo donde hay texto: no se envían las vacías. */
function conTexto(justificaciones: JustificacionesPorRegla): JustificacionesPorRegla {
  return Object.fromEntries(Object.entries(justificaciones).filter(([, texto]) => texto.trim() !== ''));
}
