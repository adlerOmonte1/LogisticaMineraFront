import { Type, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AvisosService } from '@core/consulta/avisos.service';
import { DialogosService } from '@core/dialogos/dialogos.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { SesionService } from '@core/sesion/sesion.service';
import { ErrorApi } from '@models/error-api.model';
import { CatalogoRecorrido, Lote, RespuestaLote } from '@models/lote.model';
import { Aviso } from '@models/consulta.model';
import { Pagina } from '@models/pagina.model';
import { Rol } from '@models/rol.model';
import { RUTAS_PENDIENTES } from '@core/layout/rutas-pendientes';
import { estabilizar } from '../../testing/estabilizar';
import { crearLote, crearLoteFila, crearRespuestaLogin, crearResumenLote } from '../../testing/fabricas';
import { CatalogoRecorridoApiService } from './data-access/catalogo-recorrido-api.service';
import { LotesApiService } from './data-access/lotes-api.service';
import { AbrirLotePage } from './pages/abrir-lote/abrir-lote.page';
import { CerrarLotePage } from './pages/cerrar-lote/cerrar-lote.page';
import { CierreLotesPage } from './pages/cierre-lotes/cierre-lotes.page';
import { LoteDetallePage } from './pages/lote-detalle/lote-detalle.page';
import { LotesPage } from './pages/lotes/lotes.page';
import { TRAZABILIDAD_ROUTES } from './trazabilidad.routes';
import { DialogoEtapaComponent } from './ui/dialogo-etapa/dialogo-etapa.component';

const CATALOGO: CatalogoRecorrido = {
  etapas: [
    { codigo: 'SECADO', nombre: 'Secado', orden: 1 },
    { codigo: 'ZARANDEO', nombre: 'Zarandeo', orden: 2 },
    { codigo: 'MOLIENDA', nombre: 'Molienda', orden: 3 },
    { codigo: 'ENSACADO', nombre: 'Ensacado', orden: 4 },
  ],
  rutas: [{ codigo: 'ZARANDEO_ENSACADO', nombre: 'Zaranda', etapas: ['ZARANDEO', 'ENSACADO'] }],
  destinos: [
    { codigo: 'VENTA', nombre: 'Venta' },
    { codigo: 'TRASLADO', nombre: 'Traslado a otro punto' },
  ],
};

function pagina<T>(results: T[]): Pagina<T> {
  return { count: results.length, next: null, previous: null, results };
}

function textos(raiz: HTMLElement, prueba: string): string[] {
  return [...raiz.querySelectorAll(`[data-prueba="${prueba}"]`)].map((e) => e.textContent?.trim() ?? '');
}

function hay(raiz: HTMLElement, prueba: string): boolean {
  return raiz.querySelector(`[data-prueba="${prueba}"]`) !== null;
}

/** Monta una página con la sesión del rol indicado y los servicios de datos simulados. */
function montarPagina<T>(
  pagina: Type<T>,
  rol: Rol,
  proveedores: unknown[],
  entradas: Record<string, unknown> = {},
) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideNoopAnimations(), ...(proveedores as never[])],
  });
  TestBed.inject(SesionService).iniciar(crearRespuestaLogin(rol));
  const fixture = TestBed.createComponent(pagina);
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  estabilizar(fixture);
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

describe('LotesPage (HU-M06-01)', () => {
  let api: jasmine.SpyObj<LotesApiService>;

  const montar = (rol: Rol) => {
    api = jasmine.createSpyObj<LotesApiService>('LotesApiService', ['listar']);
    api.listar.and.returnValue(
      of(pagina([crearLoteFila(), crearLoteFila({ id: 13, nombre: 'Otro', estado: 'ABIERTO' })])),
    );
    const minerales = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [
      'listarVigentes',
    ]);
    minerales.listarVigentes.and.returnValue(of([]));
    return montarPagina(LotesPage, rol, [
      { provide: LotesApiService, useValue: api },
      { provide: TiposMineralApiService, useValue: minerales },
      { provide: AvisosService, useValue: { avisos: avisos } },
    ]);
  };
  const avisos = signal<readonly Aviso[]>([]);

  afterEach(() => localStorage.clear());

  it('el aviso de ingresos sin lote sale con el texto del servidor', () => {
    avisos.set([
      {
        tipo: 'SIN_LOTE',
        titulo: '2 ingresos esperan en cancha sin lote',
        detalle: 'ING-1, ING-2',
        enlace: '/lotes',
      },
    ]);
    const { raiz } = montar('ADMINISTRADOR');
    expect(textos(raiz, 'aviso-sin-lote')[0]).toContain('2 ingresos esperan en cancha sin lote');
    avisos.set([]);
  });

  it('los botones segmentados filtran por estado', () => {
    const { raiz } = montar('SUPERVISOR');
    raiz.querySelector<HTMLButtonElement>('[data-prueba="segmento-CERRADO"]')?.click();
    expect(api.listar.calls.mostRecent().args[0].estado).toBe('CERRADO');
  });

  it('lista los lotes con su estado, mineral e ingresos para cualquier rol', () => {
    const { raiz } = montar('SUPERVISOR');
    expect(textos(raiz, 'nombre')).toEqual(['Lote prueba', 'Otro']);
    expect(raiz.textContent).toContain('En recorrido');
    expect(raiz.textContent).toContain('Abierto');
    expect(raiz.textContent).toContain('Zinc');
  });

  it('«Abrir lote» es de gestión: el Supervisor no lo ve (CA15)', () => {
    expect(hay(montar('ADMINISTRATIVO').raiz, 'abrir-lote')).toBeTrue();
    expect(hay(montar('ADMINISTRADOR').raiz, 'abrir-lote')).toBeTrue();
    expect(hay(montar('SUPERVISOR').raiz, 'abrir-lote')).toBeFalse();
  });

  it('filtrar vuelve a la primera página con el filtro elegido', () => {
    const { fixture } = montar('ADMINISTRATIVO');
    fixture.componentInstance['filtrarPorEstado']('CERRADO');
    fixture.componentInstance['filtrarPorMineral'](3);
    fixture.componentInstance['filtrarPorFechas']({ desde: '2026-11-01' });
    expect(api.listar.calls.mostRecent().args).toEqual([
      { estado: 'CERRADO', tipo_mineral: 3, desde: '2026-11-01', hasta: '' },
      1,
    ]);
  });

  it('sin lotes muestra el estado vacío', () => {
    api = jasmine.createSpyObj<LotesApiService>('LotesApiService', ['listar']);
    api.listar.and.returnValue(of(pagina([])));
    const minerales = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [
      'listarVigentes',
    ]);
    minerales.listarVigentes.and.returnValue(of([]));
    const { raiz } = montarPagina(LotesPage, 'ADMINISTRADOR', [
      { provide: LotesApiService, useValue: api },
      { provide: TiposMineralApiService, useValue: minerales },
      { provide: AvisosService, useValue: { avisos: signal([]) } },
    ]);
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('No hay lotes');
  });
});

describe('AbrirLotePage (HU-M06-01 CA01 a CA03)', () => {
  let api: jasmine.SpyObj<LotesApiService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  function montar() {
    api = jasmine.createSpyObj<LotesApiService>('LotesApiService', ['abrir']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', [
      'exito',
      'error',
      'rechazo',
    ]);
    const minerales = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [
      'listarVigentes',
    ]);
    minerales.listarVigentes.and.returnValue(of([]));
    return montarPagina(AbrirLotePage, 'ADMINISTRATIVO', [
      { provide: LotesApiService, useValue: api },
      { provide: NotificacionService, useValue: notificacion },
      { provide: TiposMineralApiService, useValue: minerales },
    ]);
  }

  function llenarYAbrir(raiz: HTMLElement, fixture: { detectChanges: () => void }): void {
    const nombre = raiz.querySelector<HTMLInputElement>('[data-prueba="nombre"]');
    if (nombre) {
      nombre.value = '  Lote 7  ';
      nombre.dispatchEvent(new Event('input'));
    }
    raiz.querySelector<HTMLButtonElement>('[data-prueba="abrir"]')?.click();
    fixture.detectChanges();
  }

  afterEach(() => localStorage.clear());

  it('el selector de fecha no ofrece días futuros y viene en hoy', () => {
    const { raiz } = montar();
    const fecha = raiz.querySelector<HTMLInputElement>('[data-prueba="fecha-apertura"]');
    expect(fecha?.max).toBeTruthy();
    expect(fecha?.value).toBe(fecha?.max ?? '');
  });

  it('abre el lote, muestra el mensaje del servidor y va a su detalle (CA01)', () => {
    const { fixture, raiz } = montar();
    const respuesta: RespuestaLote = {
      ...crearLote({ id: 77, estado: 'ABIERTO' }),
      mensaje: 'Lote «Lote 7» abierto',
    };
    api.abrir.and.returnValue(of(respuesta));
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    llenarYAbrir(raiz, fixture);

    expect(api.abrir.calls.mostRecent().args[0].nombre).toBe('Lote 7');
    expect(notificacion.exito).toHaveBeenCalledOnceWith('Lote «Lote 7» abierto');
    expect(navegar).toHaveBeenCalledWith(['/lotes', 77]);
  });

  it('un nombre repetido o una apertura futura vuelven con el mensaje literal del servidor (CA02, CA03)', () => {
    const { fixture, raiz } = montar();
    api.abrir.and.returnValue(
      throwError(() => new ErrorApi(400, 'ERROR', 'Ya existe un lote con ese nombre')),
    );
    llenarYAbrir(raiz, fixture);
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('Ya existe un lote con ese nombre');
  });
});

describe('LoteDetallePage', () => {
  let api: jasmine.SpyObj<LotesApiService>;
  let dialogos: jasmine.SpyObj<DialogosService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  function montar(rol: Rol, lote: Lote = crearLote()) {
    api = jasmine.createSpyObj<LotesApiService>('LotesApiService', [
      'obtener',
      'secadoPropio',
      'registrarEtapa',
      'quitarMineral',
      'retirar',
      'iniciarRecorrido',
      'disponibles',
    ]);
    api.obtener.and.returnValue(of(lote));
    dialogos = jasmine.createSpyObj<DialogosService>('DialogosService', ['abrir', 'confirmar']);
    dialogos.abrir.and.returnValue(of(undefined));
    dialogos.confirmar.and.returnValue(of(true));
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', [
      'exito',
      'error',
      'rechazo',
    ]);
    const catalogo = jasmine.createSpyObj<CatalogoRecorridoApiService>('CatalogoRecorridoApiService', [
      'catalogo',
    ]);
    catalogo.catalogo.and.returnValue(of(CATALOGO));
    const minerales = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [
      'listarVigentes',
    ]);
    minerales.listarVigentes.and.returnValue(of([]));
    return montarPagina(
      LoteDetallePage,
      rol,
      [
        { provide: LotesApiService, useValue: api },
        { provide: CatalogoRecorridoApiService, useValue: catalogo },
        { provide: TiposMineralApiService, useValue: minerales },
        { provide: DialogosService, useValue: dialogos },
        { provide: NotificacionService, useValue: notificacion },
      ],
      { id: '12' },
    );
  }

  const acciones = (raiz: HTMLElement): string[] =>
    ['agregar-mineral', 'asignar', 'iniciar', 'dividir', 'cerrar'].filter((a) => hay(raiz, a));

  afterEach(() => localStorage.clear());

  it('carga el detalle: estado, composición, total y los pendientes del cierre (CA16)', () => {
    const { raiz } = montar('ADMINISTRADOR');
    expect(api.obtener).toHaveBeenCalledOnceWith(12);
    expect(raiz.querySelector('h1')?.textContent).toContain('Lote prueba');
    expect(textos(raiz, 'mineral')).toEqual(['Zinc']);
    expect(textos(raiz, 'total')[0]).toContain('13.20 t');
    expect(textos(raiz, 'pendientes')[0]).toContain('Falta registrar el secado');
  });

  it('el Administrador compone y divide; «Cerrar lote» aparece con todo ensacado, como en la maqueta', () => {
    expect(acciones(montar('ADMINISTRADOR').raiz)).toEqual(['agregar-mineral', 'asignar', 'dividir']);
    const listo = montar('ADMINISTRADOR', crearLote({ siguientes: [], pendientes: [] }));
    expect(acciones(listo.raiz)).toContain('cerrar');
    expect(textos(listo.raiz, 'estado')).toEqual(['Listo para cerrar']);
    expect(hay(listo.raiz, 'aviso-listo')).toBeTrue();
  });

  it('el Administrativo compone y divide, pero no cierra (HU-M06-05 CA05)', () => {
    expect(acciones(montar('ADMINISTRATIVO').raiz)).toEqual(['agregar-mineral', 'asignar', 'dividir']);
  });

  it('el Supervisor no ve ninguna acción de gestión, pero sí el «Siguiente paso» (CA15, HU-M06-04 CA10)', () => {
    const { raiz } = montar('SUPERVISOR');
    expect(acciones(raiz)).toEqual([]);
    expect(hay(raiz, 'retirar')).toBeFalse();
    expect(hay(raiz, 'quitar-mineral')).toBeFalse();
    expect(textos(raiz, 'siguiente').length).toBe(1);
  });

  it('un lote abierto ofrece iniciar el recorrido y ningún «Siguiente paso» (HU-M06-02 CA05)', () => {
    const { raiz } = montar(
      'ADMINISTRATIVO',
      crearLote({ estado: 'ABIERTO', siguientes: [], fecha_inicio_recorrido: null }),
    );
    expect(acciones(raiz)).toEqual(['agregar-mineral', 'asignar', 'iniciar']);
    expect(hay(raiz, 'siguiente')).toBeFalse();
  });

  it('un lote ya dividido no vuelve a ofrecer «Dividir» (HU-M06-04 CA06)', () => {
    const lote = crearLote({
      partes: [
        {
          id: 1,
          nombre: 'A',
          fraccion: '1/2',
          ruta: 'ZARANDEO_ENSACADO',
          ruta_texto: 'Zaranda',
          toneladas_aproximadas: '6.60',
          es_estimacion: true,
        },
      ],
    });
    expect(hay(montar('ADMINISTRADOR', lote).raiz, 'dividir')).toBeFalse();
  });

  it('un lote cerrado no ofrece ninguna acción de composición ni de etapa y muestra su destino (HU-M06-05 CA07)', () => {
    const lote = crearLote({
      estado: 'CERRADO',
      siguientes: [],
      pendientes: [],
      destino: 'VENTA',
      destino_texto: 'Venta',
      fecha_cierre: '2026-11-05T09:00:00-05:00',
      usuario_cierre: 'admin.prueba',
    });
    const { raiz } = montar('ADMINISTRADOR', lote);
    expect(acciones(raiz)).toEqual([]);
    for (const accion of ['retirar', 'quitar-mineral', 'siguiente', 'asociar-bigbags']) {
      expect(hay(raiz, accion)).withContext(accion).toBeFalse();
    }
    const aviso = textos(raiz, 'aviso-cerrado')[0];
    expect(aviso).toContain('venta');
    expect(aviso).toContain('admin.prueba');
    expect(hay(raiz, 'ver-resumen')).toBeTrue();
  });

  it('solo se ofrece lo que dice `siguientes`: sin entradas no hay botones, aunque esté en recorrido', () => {
    const { raiz } = montar('SUPERVISOR', crearLote({ siguientes: [] }));
    expect(hay(raiz, 'siguiente')).toBeFalse();
  });

  it('«Asociar bigbags» aparece cuando ya hay ensacado (HU-M06-02 CA13)', () => {
    const sinEnsacado = montar('SUPERVISOR');
    expect(hay(sinEnsacado.raiz, 'asociar-bigbags')).toBeFalse();
    const conEnsacado = montar(
      'SUPERVISOR',
      crearLote({
        ruta: 'ZARANDEO_ENSACADO',
        recorrido: [
          {
            id: 1,
            etapa: 'ENSACADO',
            etapa_texto: 'Ensacado',
            carga: 'Lote prueba',
            parte: null,
            ingreso_tardio: null,
            fecha_hora: '2026-11-04T09:00:00-05:00',
            usuario: 'sup.prueba',
            horas_molienda: null,
            observacion: '',
          },
        ],
      }),
    );
    expect(hay(conEnsacado.raiz, 'asociar-bigbags')).toBeTrue();
  });

  describe('registrar el siguiente paso', () => {
    function pulsarSiguiente(raiz: HTMLElement): void {
      raiz.querySelector<HTMLButtonElement>('[data-prueba="siguiente"]')?.click();
    }

    it('abre el diálogo de la etapa con la carga que ofreció el servidor, en un toque', () => {
      const { raiz } = montar('SUPERVISOR');
      pulsarSiguiente(raiz);
      const [componente, datos] = dialogos.abrir.calls.mostRecent().args as [
        unknown,
        { siguiente: unknown; titulo: string },
      ];
      expect(componente).toBe(DialogoEtapaComponent);
      expect(datos.siguiente).toEqual(crearLote().siguientes[0]);
      expect(datos.titulo).toBe('Registrar secado');
    });

    it('la etapa de un lote se registra con `etapas/` y la carga exacta de `siguientes`', () => {
      const { raiz } = montar(
        'SUPERVISOR',
        crearLote({
          siguientes: [{ carga: 'Parte A', parte: 4, ingreso: null, etapa: 'ZARANDEO', elegir_ruta: false }],
        }),
      );
      api.registrarEtapa.and.returnValue(
        of({ ...crearLote(), paso: { id: 1, etapa: 'ZARANDEO', carga: 'Parte A' } }),
      );
      pulsarSiguiente(raiz);
      const datos = dialogos.abrir.calls.mostRecent().args[1] as {
        guardar: (v: unknown) => unknown;
      };
      datos.guardar({
        ruta: null,
        fecha_hora: '2026-11-03T10:00:00-05:00',
        horas_molienda: null,
        observacion: '',
        bigbags: null,
        fracciones: [],
      });
      expect(api.registrarEtapa).toHaveBeenCalledOnceWith(12, {
        etapa: 'ZARANDEO',
        ruta: null,
        parte: 4,
        ingreso: null,
        fecha_hora: '2026-11-03T10:00:00-05:00',
        horas_molienda: null,
        observacion: '',
        bigbags: null,
      });
    });

    it('tras el secado envía la ruta elegida y no una etapa (CA02)', () => {
      const { raiz } = montar(
        'SUPERVISOR',
        crearLote({
          siguientes: [{ carga: 'Lote prueba', parte: null, ingreso: null, etapa: null, elegir_ruta: true }],
        }),
      );
      api.registrarEtapa.and.returnValue(
        of({ ...crearLote(), paso: { id: 1, etapa: 'SECADO', carga: 'x' } }),
      );
      pulsarSiguiente(raiz);
      const datos = dialogos.abrir.calls.mostRecent().args[1] as {
        guardar: (v: unknown) => unknown;
        titulo: string;
      };
      expect(datos.titulo).toBe('Elegir la ruta');
      datos.guardar({
        ruta: 'ZARANDEO_ENSACADO',
        fecha_hora: null,
        horas_molienda: null,
        observacion: '',
        bigbags: null,
        fracciones: [],
      });
      const cuerpo = api.registrarEtapa.calls.mostRecent().args[1];
      expect(cuerpo.etapa).toBeNull();
      expect(cuerpo.ruta).toBe('ZARANDEO_ENSACADO');
    });

    it('el secado de un tardío va al endpoint del secado propio, con su reparto (CA14)', () => {
      const { raiz } = montar(
        'SUPERVISOR',
        crearLote({
          siguientes: [{ carga: 'ING-9', parte: null, ingreso: 331, etapa: 'SECADO', elegir_ruta: false }],
        }),
      );
      api.secadoPropio.and.returnValue(of(crearLote()));
      pulsarSiguiente(raiz);
      const datos = dialogos.abrir.calls.mostRecent().args[1] as { guardar: (v: unknown) => unknown };
      datos.guardar({
        ruta: null,
        fecha_hora: null,
        horas_molienda: null,
        observacion: 'tarde',
        bigbags: null,
        fracciones: [{ parte: 1, fraccion: '1/2' }],
      });
      expect(api.secadoPropio).toHaveBeenCalledOnceWith(12, 331, {
        fecha_hora: null,
        observacion: 'tarde',
        fracciones: [{ parte: 1, fraccion: '1/2' }],
      });
      expect(api.registrarEtapa).not.toHaveBeenCalled();
    });

    it('al guardar refleja el lote nuevo, muestra el mensaje y el rendimiento de la molienda (CA01, CA10)', () => {
      const { fixture, raiz } = montar('SUPERVISOR');
      const respuesta = {
        ...crearLote({ siguientes: [], pendientes: [] }),
        mensaje: 'Molienda registrada en Lote prueba',
        paso: { id: 5, etapa: 'MOLIENDA' as const, carga: 'Lote prueba', toneladas_por_hora: '3.30' },
      };
      dialogos.abrir.and.returnValue(of(respuesta));
      pulsarSiguiente(raiz);
      estabilizar(fixture);
      expect(notificacion.exito).toHaveBeenCalledOnceWith('Molienda registrada en Lote prueba');
      expect(hay(raiz, 'siguiente')).toBeFalse();
      expect(textos(raiz, 'rendimiento')[0]).toBe('Rendimiento de la molienda: 3.30 t/h (estimado)');
    });
  });

  describe('acciones de gestión', () => {
    it('retirar un ingreso pide confirmación y usa el servidor; el rechazo sale literal (CA22, CA23)', () => {
      const { raiz } = montar('ADMINISTRATIVO');
      api.retirar.and.returnValue(
        throwError(() => new ErrorApi(400, 'ERROR', 'No se puede retirar el único ingreso')),
      );
      raiz.querySelector<HTMLButtonElement>('[data-prueba="retirar"]')?.click();
      expect(dialogos.confirmar).toHaveBeenCalled();
      expect(api.retirar).toHaveBeenCalledOnceWith(12, 331);
      expect(notificacion.rechazo).toHaveBeenCalled();
    });

    it('si el usuario no confirma, no se llama al servidor', () => {
      const { raiz } = montar('ADMINISTRATIVO');
      dialogos.confirmar.and.returnValue(of(false));
      raiz.querySelector<HTMLButtonElement>('[data-prueba="retirar"]')?.click();
      expect(api.retirar).not.toHaveBeenCalled();
    });

    it('un conflicto (409) vuelve a leer el lote', () => {
      const { raiz } = montar('ADMINISTRATIVO');
      api.retirar.and.returnValue(throwError(() => new ErrorApi(409, 'CONFLICTO', 'El lote cambió')));
      raiz.querySelector<HTMLButtonElement>('[data-prueba="retirar"]')?.click();
      expect(api.obtener).toHaveBeenCalledTimes(2);
    });

    it('quitar un mineral con ingresos lo decide el servidor (CA19)', () => {
      const { raiz } = montar('ADMINISTRATIVO');
      api.quitarMineral.and.returnValue(
        throwError(() => new ErrorApi(400, 'ERROR', 'El mineral tiene ingresos')),
      );
      raiz.querySelector<HTMLButtonElement>('[data-prueba="quitar-mineral"]')?.click();
      expect(api.quitarMineral).toHaveBeenCalledOnceWith(12, 1);
    });

    it('asignar pide primero los ingresos disponibles y abre el diálogo', () => {
      const { raiz } = montar('ADMINISTRATIVO');
      api.disponibles.and.returnValue(of({ ingresos: [], otros_minerales: [] }));
      raiz.querySelector<HTMLButtonElement>('[data-prueba="asignar"]')?.click();
      expect(api.disponibles).toHaveBeenCalledOnceWith(12);
      expect(dialogos.abrir).toHaveBeenCalled();
    });

    it('iniciar el recorrido pide confirmación (CA10)', () => {
      const { raiz } = montar('ADMINISTRATIVO', crearLote({ estado: 'ABIERTO', siguientes: [] }));
      api.iniciarRecorrido.and.returnValue(of({ ...crearLote(), mensaje: 'Recorrido iniciado' }));
      raiz.querySelector<HTMLButtonElement>('[data-prueba="iniciar"]')?.click();
      expect(api.iniciarRecorrido).toHaveBeenCalledOnceWith(12);
      expect(notificacion.exito).toHaveBeenCalledWith('Recorrido iniciado');
    });
  });
});

describe('CerrarLotePage (HU-M06-05)', () => {
  let api: jasmine.SpyObj<LotesApiService>;
  let dialogos: jasmine.SpyObj<DialogosService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  function montar(lote: Lote = crearLote(), resumen = crearResumenLote()) {
    api = jasmine.createSpyObj<LotesApiService>('LotesApiService', ['obtener', 'resumen', 'cerrar']);
    api.obtener.and.returnValue(of(lote));
    api.resumen.and.returnValue(of(resumen));
    dialogos = jasmine.createSpyObj<DialogosService>('DialogosService', ['confirmar']);
    dialogos.confirmar.and.returnValue(of(true));
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', [
      'exito',
      'error',
      'rechazo',
    ]);
    const catalogo = jasmine.createSpyObj<CatalogoRecorridoApiService>('CatalogoRecorridoApiService', [
      'catalogo',
    ]);
    catalogo.catalogo.and.returnValue(of(CATALOGO));
    return montarPagina(
      CerrarLotePage,
      'ADMINISTRADOR',
      [
        { provide: LotesApiService, useValue: api },
        { provide: CatalogoRecorridoApiService, useValue: catalogo },
        { provide: DialogosService, useValue: dialogos },
        { provide: NotificacionService, useValue: notificacion },
      ],
      { id: '12' },
    );
  }

  afterEach(() => localStorage.clear());

  it('la diferencia entre el ensacado y lo registrado se señala como estimación (CA06)', () => {
    const { raiz } = montar();
    const cifra = (prueba: string) => textos(raiz, prueba)[0].replace(/\s+/g, ' ');
    expect(cifra('diferencia')).toContain('≈ +0.30');
    expect(cifra('ensacado')).toContain('≈ 13.50');
    expect(cifra('bigbags')).toContain('estimación');
    expect(cifra('registradas')).not.toContain('≈');
    expect(raiz.textContent).toContain('Supera lo registrado · estimación');
    expect(cifra('rendimiento')).toContain('3.30 t/h');
  });

  it('lista lo que falta para cerrar, y deja que el servidor decida (CA02)', () => {
    const { raiz } = montar(crearLote(), crearResumenLote({ pendientes: ['Falta el ensacado de Parte A'] }));
    expect(textos(raiz, 'pendientes')[0]).toContain('Falta el ensacado de Parte A');
    expect(hay(raiz, 'listo')).toBeFalse();
    expect(hay(raiz, 'confirmar-cierre')).toBeTrue();
  });

  it('sin pendientes dice que está listo', () => {
    expect(hay(montar().raiz, 'listo')).toBeTrue();
  });

  it('cierra con el destino, tras confirmar, y vuelve al lote con el mensaje del servidor (CA01)', () => {
    const { fixture, raiz } = montar();
    api.cerrar.and.returnValue(
      of({ ...crearLote({ estado: 'CERRADO' }), mensaje: 'Lote cerrado con destino venta' }),
    );
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.componentInstance['formulario'].patchValue({ destino: 'VENTA', observacion: ' Cliente X ' });

    raiz.querySelector<HTMLButtonElement>('[data-prueba="confirmar-cierre"]')?.click();
    fixture.detectChanges();

    expect(dialogos.confirmar).toHaveBeenCalled();
    expect(api.cerrar).toHaveBeenCalledOnceWith(12, { destino: 'VENTA', observacion: 'Cliente X' });
    expect(notificacion.exito).toHaveBeenCalledWith('Lote cerrado con destino venta');
    expect(navegar).toHaveBeenCalledWith(['/lotes', 12]);
  });

  it('sin destino o con pendientes el rechazo del servidor se muestra literal (CA02, CA03)', () => {
    const { fixture, raiz } = montar();
    api.cerrar.and.returnValue(
      throwError(() => new ErrorApi(400, 'ERROR', 'Debe indicar el destino del lote')),
    );
    raiz.querySelector<HTMLButtonElement>('[data-prueba="confirmar-cierre"]')?.click();
    fixture.detectChanges();
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('Debe indicar el destino del lote');
  });

  it('no confirmar no cierra nada', () => {
    const { raiz } = montar();
    dialogos.confirmar.and.returnValue(of(false));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="confirmar-cierre"]')?.click();
    expect(api.cerrar).not.toHaveBeenCalled();
  });

  it('un lote ya cerrado no ofrece cerrar otra vez (CA04)', () => {
    const { raiz } = montar(crearLote({ estado: 'CERRADO' }));
    expect(hay(raiz, 'confirmar-cierre')).toBeFalse();
    expect(hay(raiz, 'no-cerrable')).toBeTrue();
  });
});

describe('CierreLotesPage (HU-M06-05 CA05)', () => {
  it('pide solo los lotes en recorrido y dice cuáles están listos y cuáles tienen pendientes', () => {
    const api = jasmine.createSpyObj<LotesApiService>('LotesApiService', ['listar', 'resumen']);
    api.listar.and.callFake((filtro) =>
      filtro.estado === 'CERRADO'
        ? of(pagina([crearLoteFila({ id: 9, nombre: 'Z', estado: 'CERRADO', destino: 'VENTA' })]))
        : of(
            pagina([
              crearLoteFila({ id: 1, nombre: 'A' }),
              crearLoteFila({ id: 2, nombre: 'B' }),
              crearLoteFila({ id: 3, nombre: 'C' }),
            ]),
          ),
    );
    api.resumen.and.callFake((id: number) =>
      id === 1
        ? of(crearResumenLote())
        : id === 2
          ? of(crearResumenLote({ pendientes: ['p1', 'p2'] }))
          : throwError(() => new ErrorApi(500, 'ERROR', 'falló')),
    );
    const { raiz } = montarPagina(CierreLotesPage, 'ADMINISTRADOR', [
      { provide: LotesApiService, useValue: api },
    ]);

    expect(api.listar.calls.allArgs().map(([filtro]) => filtro.estado)).toEqual(['EN_RECORRIDO', 'CERRADO']);
    const estados = (seccion: string) =>
      [...raiz.querySelectorAll(`[data-prueba="${seccion}"] [data-prueba="estado-cierre"]`)].map((e) =>
        (e.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );
    expect(estados('seccion-listos')).toEqual(['Listo para cerrar']);
    expect(estados('seccion-proceso')).toEqual(['P1 y 1 más', 'No disponible']);
    expect(raiz.textContent).toContain('Cerrado · Venta');
    expect(raiz.querySelectorAll('[data-prueba="cerrar-lote"]').length).toBe(4);
  });
});

describe('rutas de trazabilidad', () => {
  const ruta = (path: string) => TRAZABILIDAD_ROUTES.find((r) => r.path === path);

  it('«nuevo» y «cierre» van antes de «:id» para no leerse como identificador', () => {
    const rutas = TRAZABILIDAD_ROUTES.map((r) => r.path);
    expect(rutas.indexOf('nuevo')).toBeLessThan(rutas.indexOf(':id'));
    expect(rutas.indexOf('cierre')).toBeLessThan(rutas.indexOf(':id'));
  });

  it('abrir es de gestión; cierre y cerrar son del Administrador; ver, de todos', () => {
    expect(ruta('nuevo')?.canActivate?.length).toBe(1);
    expect(ruta('cierre')?.canActivate?.length).toBe(1);
    expect(ruta(':id/cerrar')?.canActivate?.length).toBe(1);
    expect(ruta('')?.canActivate).toBeUndefined();
    expect(ruta(':id')?.canActivate).toBeUndefined();
  });

  it('cada ruta carga su página', async () => {
    const paginas = await Promise.all(TRAZABILIDAD_ROUTES.map((r) => r.loadComponent?.()));
    expect(paginas).toEqual([LotesPage, AbrirLotePage, CierreLotesPage, LoteDetallePage, CerrarLotePage]);
  });

  it('Trazabilidad y Cierre de lotes ya no son pantallas pendientes', () => {
    const pendientes = RUTAS_PENDIENTES.map((r) => r.path);
    expect(pendientes).not.toContain('lotes');
    expect(pendientes).not.toContain('lotes/cierre');
  });
});
