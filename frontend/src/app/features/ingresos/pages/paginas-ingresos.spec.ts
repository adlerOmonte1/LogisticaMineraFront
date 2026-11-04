import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { TransportistasApiService } from '@core/catalogo/transportistas-api.service';
import { VehiculosApiService } from '@core/catalogo/vehiculos-api.service';
import { DialogosService } from '@core/dialogos/dialogos.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { ErrorApi } from '@models/error-api.model';
import { PendientesDestare } from '@models/ingreso.model';
import { crearBorrador, crearIngreso, crearRespuestaLogin, crearVehiculo } from '../../../testing/fabricas';
import { estabilizar } from '../../../testing/estabilizar';
import { SesionService } from '@core/sesion/sesion.service';
import { IngresosApiService } from '../data-access/ingresos-api.service';
import { BorradorLocalService } from '../data-access/borrador-local.service';
import { AnularIngresoPage } from './anular-ingreso/anular-ingreso.page';
import { CorregirIngresoPage } from './corregir-ingreso/corregir-ingreso.page';
import { DestaresPage } from './destares/destares.page';
import { RegistrarIngresoPage } from './registrar-ingreso/registrar-ingreso.page';
import { RevertirCorreccionPage } from './revertir-correccion/revertir-correccion.page';

const metodosApi = [
  'iniciarBorrador',
  'iniciarBorradorSinFoto',
  'registrar',
  'obtener',
  'corregir',
  'revertirCorreccion',
  'anular',
  'pendientesDestare',
  'registrarDestare',
] as const;

describe('Páginas de ingresos', () => {
  let api: jasmine.SpyObj<IngresosApiService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;
  let router: Router;

  beforeEach(() => {
    api = jasmine.createSpyObj<IngresosApiService>('IngresosApiService', [...metodosApi]);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', [
      'exito',
      'error',
      'rechazo',
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: IngresosApiService, useValue: api },
        { provide: NotificacionService, useValue: notificacion },
      ],
    });
  });

  /** Se llama al montar cada página, después de que cada prueba sobrescribió sus proveedores. */
  function iniciarSesionYRouter(): void {
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin('ADMINISTRADOR', { id: 1 }));
  }

  afterEach(() => localStorage.clear());

  describe('RegistrarIngresoPage', () => {
    let tipos: jasmine.SpyObj<TiposMineralApiService>;
    let vehiculos: jasmine.SpyObj<VehiculosApiService>;
    let transportistas: jasmine.SpyObj<TransportistasApiService>;
    let dialogos: jasmine.SpyObj<DialogosService>;
    let local: jasmine.SpyObj<BorradorLocalService>;

    beforeEach(() => {
      tipos = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [
        'listarVigentes',
        'crear',
      ]);
      tipos.listarVigentes.and.returnValue(
        of([{ id: 1, codigo: 'MOA', nombre: 'Óxido', unidad_medida: 'TONELADA', activo: true }]),
      );
      vehiculos = jasmine.createSpyObj<VehiculosApiService>('VehiculosApiService', ['listar', 'crear']);
      transportistas = jasmine.createSpyObj<TransportistasApiService>('TransportistasApiService', [
        'listarVigentes',
      ]);
      transportistas.listarVigentes.and.returnValue(of([]));
      dialogos = jasmine.createSpyObj<DialogosService>('DialogosService', ['abrir', 'confirmar']);
      local = jasmine.createSpyObj<BorradorLocalService>('BorradorLocalService', [
        'leer',
        'guardar',
        'descartar',
      ]);
      local.leer.and.resolveTo(null);
      local.guardar.and.resolveTo();
      local.descartar.and.resolveTo();
      TestBed.overrideProvider(TiposMineralApiService, { useValue: tipos });
      TestBed.overrideProvider(VehiculosApiService, { useValue: vehiculos });
      TestBed.overrideProvider(TransportistasApiService, { useValue: transportistas });
      TestBed.overrideProvider(DialogosService, { useValue: dialogos });
      TestBed.overrideProvider(BorradorLocalService, { useValue: local });
    });

    function montar() {
      iniciarSesionYRouter();
      const fixture = TestBed.createComponent(RegistrarIngresoPage);
      estabilizar(fixture);
      return {
        fixture,
        pagina: fixture.componentInstance as unknown as RegistrarIngresoPageInterno,
        raiz: fixture.nativeElement as HTMLElement,
      };
    }

    interface RegistrarIngresoPageInterno {
      store: {
        paso(): string;
        propuesta(): unknown;
        consultaVehiculo(): { vehiculo: unknown } | null;
        tiposMineral(): unknown[];
        capturarSinFoto(m: string): void;
        capturar(f: Blob): Promise<void>;
      };
      formulario: {
        getRawValue(): Record<string, unknown>;
        controls: {
          placa: { value: string; setValue(v: string): void };
          tipo_mineral: { value: number | null };
        };
      };
      registrarVehiculo(placa: string): void;
      agregarTipoMineral(): void;
      registrarOtro(): void;
    }

    it('empieza en la captura con los tres pasos visibles', () => {
      const { raiz, pagina } = montar();
      expect(pagina.store.paso()).toBe('captura');
      expect(raiz.querySelector('app-captura-ticket')).not.toBeNull();
      expect(raiz.querySelector('app-pasos-registro')).not.toBeNull();
      expect(pagina.store.tiposMineral().length).toBe(1);
    });

    it('al llegar la propuesta precarga el formulario y muestra la revisión', async () => {
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      const { fixture, pagina, raiz } = montar();

      await pagina.store.capturar(new Blob(['x'], { type: 'image/jpeg' }));
      estabilizar(fixture);

      expect(raiz.querySelector('app-revision-ingreso')).not.toBeNull();
      expect(pagina.formulario.getRawValue()).toEqual(
        jasmine.objectContaining({
          placa: 'V2K-841',
          fecha: '2026-10-30',
          hora: '16:33',
          peso_bruto_tn: '29.80',
        }),
      );
    });

    it('un registro en curso se ofrece al abrir y se continúa sin volver a fotografiar', async () => {
      const propuesta = crearBorrador();
      local.leer.and.resolveTo({
        usuarioId: 1,
        paso: 'revision',
        imagen: new Blob(['x']),
        sinFoto: null,
        propuesta,
        campos: {
          placa: 'V2K-841',
          fecha: '2026-09-14',
          hora: '08:00',
          peso_bruto_tn: '25.00',
          tipo_mineral: 1,
        },
        justificaciones: {},
        actualizado: '2026-11-03T16:34:00-05:00',
      });
      const { fixture, raiz, pagina } = montar();
      await fixture.whenStable();
      estabilizar(fixture);
      expect(raiz.querySelector('[data-prueba="registro-en-curso"]')?.textContent).toContain(
        '03/11/2026 16:34',
      );

      raiz.querySelector<HTMLButtonElement>('[data-prueba="continuar-pendiente"]')?.click();
      estabilizar(fixture);

      expect(pagina.store.paso()).toBe('revision');
      expect(pagina.formulario.getRawValue()['fecha']).toBe('2026-09-14');
      expect(pagina.formulario.controls.tipo_mineral.value).toBe(1);
    });

    it('el alta del vehículo se abre en un diálogo y el registro continúa con la placa nueva', () => {
      const nuevo = crearVehiculo({ placa: 'ZZ3-901', tara_tn: null, pendiente_destare: true });
      dialogos.abrir.and.returnValue(of(nuevo));
      const { pagina } = montar();

      pagina.registrarVehiculo('zz3-901');

      expect(transportistas.listarVigentes).toHaveBeenCalled();
      const datos = dialogos.abrir.calls.mostRecent().args[1] as { placaSugerida: string; vehiculo: unknown };
      expect(datos.placaSugerida).toBe('zz3-901');
      expect(datos.vehiculo).toBeNull();
      expect(pagina.store.consultaVehiculo()?.vehiculo).toBe(nuevo);
      expect(pagina.formulario.controls.placa.value).toBe('ZZ3-901');
      expect(notificacion.exito).toHaveBeenCalledWith('Vehículo registrado');
    });

    it('si el diálogo se cancela, no cambia nada', () => {
      dialogos.abrir.and.returnValue(of(undefined));
      const { pagina } = montar();
      pagina.registrarVehiculo('ZZ3-901');
      expect(notificacion.exito).not.toHaveBeenCalled();
    });

    it('el tipo de mineral nuevo queda elegido en el ingreso (CA14)', () => {
      const nuevo = {
        id: 9,
        codigo: 'ZNUEVO',
        nombre: 'Nuevo',
        unidad_medida: 'TONELADA' as const,
        activo: true,
      };
      dialogos.abrir.and.returnValue(of(nuevo));
      const { pagina } = montar();

      pagina.agregarTipoMineral();

      expect(pagina.formulario.controls.tipo_mineral.value).toBe(9);
      expect(tipos.listarVigentes).toHaveBeenCalledTimes(2);
      const datos = dialogos.abrir.calls.mostRecent().args[1] as {
        desdeRegistro: boolean;
        guardar(v: { codigo: string; nombre: string }): unknown;
      };
      tipos.crear.and.returnValue(of(nuevo));
      datos.guardar({ codigo: '', nombre: 'Nuevo' });
      expect(tipos.crear).toHaveBeenCalledWith({ codigo: '', nombre: 'Nuevo', desde_registro: true });
      expect(datos.desdeRegistro).toBeTrue();
    });

    it('«registrar otro» vuelve a la captura', async () => {
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      const { pagina } = montar();
      await pagina.store.capturar(new Blob(['x'], { type: 'image/jpeg' }));
      pagina.registrarOtro();
      expect(pagina.store.paso()).toBe('captura');
      expect(pagina.store.propuesta()).toBeNull();
    });
  });

  describe('DestaresPage', () => {
    const pendientes: PendientesDestare = {
      count: 1,
      mensaje: null,
      vehiculos: [{ id: 3, placa: 'ZZ3-901', ingresos: 1 }],
      results: [
        {
          id: 332,
          codigo: 'ING-2026-00332',
          vehiculo: 3,
          placa: 'ZZ3-901',
          fecha_hora_pesaje: '2026-09-13T16:42:00-05:00',
          peso_bruto_tn: '15.50',
        },
      ],
    };

    function montar() {
      iniciarSesionYRouter();
      const fixture = TestBed.createComponent(DestaresPage);
      estabilizar(fixture);
      return {
        fixture,
        pagina: fixture.componentInstance as unknown as DestaresInterno,
        raiz: fixture.nativeElement as HTMLElement,
      };
    }

    interface DestaresInterno {
      elegir(id: number): void;
      registrar(
        vehiculo: number,
        datos: { tara_tn: string; fecha_destare: string | null; justificaciones: Record<string, string> },
      ): void;
      cargar(): void;
      resultado(): unknown;
      envio: { error(): ErrorApi | null };
    }

    it('sin pendientes muestra el mensaje del servidor como estado vacío (CA10)', () => {
      api.pendientesDestare.and.returnValue(
        of({ count: 0, mensaje: 'No hay vehículos pendientes de destare', vehiculos: [], results: [] }),
      );
      const { raiz } = montar();
      expect(raiz.textContent).toContain('No hay vehículos pendientes de destare');
    });

    it('lista los pendientes y, al elegir un vehículo, ofrece su formulario', () => {
      api.pendientesDestare.and.returnValue(of(pendientes));
      const { fixture, pagina, raiz } = montar();
      expect(raiz.textContent).toContain('ZZ3-901');
      expect(raiz.querySelector('app-formulario-destare')).toBeNull();

      pagina.elegir(3);
      estabilizar(fixture);
      expect(raiz.querySelector('app-formulario-destare')).not.toBeNull();
    });

    it('registra el destare del vehículo elegido y muestra el resultado', () => {
      api.pendientesDestare.and.returnValue(of(pendientes));
      api.registrarDestare.and.returnValue(
        of({
          mensaje: 'Destare registrado',
          vehiculo: { id: 3, placa: 'ZZ3-901', tara_tn: '5.25', fecha_destare: '2026-11-03T17:00:00-05:00' },
          ingresos: [
            {
              id: 332,
              codigo: 'ING-2026-00332',
              peso_bruto_tn: '15.50',
              peso_neto_tn: '10.25',
              estado: 'REGISTRADO',
            },
          ],
        }),
      );
      const { fixture, pagina, raiz } = montar();

      pagina.registrar(3, { tara_tn: '5.25', fecha_destare: null, justificaciones: {} });
      estabilizar(fixture);

      expect(api.registrarDestare).toHaveBeenCalledWith({
        vehiculo: 3,
        tara_tn: '5.25',
        fecha_destare: null,
        justificaciones: {},
      });
      expect(raiz.querySelector('[data-prueba="mensaje-destare"]')?.textContent).toContain(
        'Destare registrado',
      );

      pagina.cargar();
      expect(pagina.resultado()).toBeNull();
    });

    it('un rechazo del destare se conserva para pintarlo en el formulario', () => {
      api.pendientesDestare.and.returnValue(of(pendientes));
      const rechazo = new ErrorApi(
        400,
        'INCONSISTENCIAS',
        'La tara no puede ser mayor o igual que el peso bruto',
      );
      api.registrarDestare.and.returnValue(throwError(() => rechazo));
      const { pagina } = montar();
      pagina.registrar(3, { tara_tn: '99', fecha_destare: null, justificaciones: {} });
      expect(pagina.envio.error()).toBe(rechazo);
    });

    it('si no se puede cargar la lista, muestra el error literal', () => {
      api.pendientesDestare.and.returnValue(
        throwError(() => new ErrorApi(0, 'SIN_CONEXION', 'No hay conexión con el servidor')),
      );
      const { raiz } = montar();
      expect(raiz.querySelector('[role=alert]')?.textContent).toContain('No hay conexión con el servidor');
    });
  });

  describe('acciones sobre un ingreso', () => {
    function montar<T>(pagina: new () => T, id = '331') {
      iniciarSesionYRouter();
      const fixture = TestBed.createComponent(pagina);
      fixture.componentRef.setInput('id', id);
      estabilizar(fixture);
      return {
        fixture,
        instancia: fixture.componentInstance as unknown as Record<string, (...args: unknown[]) => void>,
        raiz: fixture.nativeElement as HTMLElement,
      };
    }

    beforeEach(() => api.obtener.and.returnValue(of(crearIngreso({ correccion_revertible: 55 }))));

    it('anular: envía el motivo, avisa con el mensaje del servidor y vuelve al detalle (HU-M03-03 CA01)', () => {
      api.anular.and.returnValue(
        of({ ...crearIngreso({ estado: 'ANULADO' }), mensaje: 'Ingreso ING-2026-00331 anulado' }),
      );
      const { instancia } = montar(AnularIngresoPage);

      instancia['anular']({ motivo: 'Ticket duplicado', justificaciones: {} });

      expect(api.anular).toHaveBeenCalledWith(331, 'Ticket duplicado');
      expect(notificacion.exito).toHaveBeenCalledWith('Ingreso ING-2026-00331 anulado');
      expect(router.navigate).toHaveBeenCalledWith(['/consulta/ingresos', '331']);
    });

    it('anular: un rechazo se queda en la pantalla con el mensaje literal', () => {
      const rechazo = new ErrorApi(400, 'MOTIVO_OBLIGATORIO', 'Debe indicar el motivo de la anulación');
      api.anular.and.returnValue(throwError(() => rechazo));
      const { instancia, raiz, fixture } = montar(AnularIngresoPage);
      instancia['anular']({ motivo: '', justificaciones: {} });
      estabilizar(fixture);
      expect(router.navigate).not.toHaveBeenCalled();
      expect(raiz.textContent).toContain('Debe indicar el motivo de la anulación');
    });

    it('revertir: envía el evento de la última corrección vigente (CA12)', () => {
      api.revertirCorreccion.and.returnValue(
        of({ ...crearIngreso(), mensaje: 'Corrección revertida en el ingreso ING-2026-00331' }),
      );
      const { instancia } = montar(RevertirCorreccionPage);

      instancia['revertir']({ motivo: 'Era correcto', justificaciones: {} });

      expect(api.revertirCorreccion).toHaveBeenCalledWith(331, {
        motivo: 'Era correcto',
        correccion: 55,
        justificaciones: {},
      });
      expect(notificacion.exito).toHaveBeenCalledWith('Corrección revertida en el ingreso ING-2026-00331');
    });

    it('revertir: sin corrección vigente no envía nada', () => {
      api.obtener.and.returnValue(of(crearIngreso({ correccion_revertible: null })));
      const { instancia } = montar(RevertirCorreccionPage);
      instancia['revertir']({ motivo: 'x', justificaciones: {} });
      expect(api.revertirCorreccion).not.toHaveBeenCalled();
    });

    it('corregir: envía solo los cambios con su motivo y carga los tipos de mineral', () => {
      const tipos = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', [
        'listarVigentes',
      ]);
      tipos.listarVigentes.and.returnValue(of([]));
      TestBed.overrideProvider(TiposMineralApiService, { useValue: tipos });
      api.corregir.and.returnValue(of({ ...crearIngreso(), mensaje: 'Ingreso ING-2026-00331 actualizado' }));
      const { instancia } = montar(CorregirIngresoPage);

      instancia['corregir']({
        cambios: { peso_bruto_tn: '26.50' },
        motivo: 'Mal transcrito',
        justificaciones: {},
      });

      expect(tipos.listarVigentes).toHaveBeenCalled();
      expect(api.corregir).toHaveBeenCalledWith(331, {
        peso_bruto_tn: '26.50',
        motivo: 'Mal transcrito',
        justificaciones: {},
      });
      expect(notificacion.exito).toHaveBeenCalledWith('Ingreso ING-2026-00331 actualizado');
    });

    it('si el ingreso no existe, muestra el error y no el formulario', () => {
      api.obtener.and.returnValue(throwError(() => new ErrorApi(404, 'ERROR', 'No encontrado')));
      const { raiz } = montar(AnularIngresoPage, '99999');
      expect(raiz.querySelector('app-formulario-motivo')).toBeNull();
      expect(raiz.querySelector('[role=alert]')).not.toBeNull();
    });

    it('cancelar vuelve al detalle sin enviar', () => {
      const { instancia } = montar(AnularIngresoPage);
      instancia['volverAlDetalle']();
      expect(router.navigate).toHaveBeenCalledWith(['/consulta/ingresos', '331']);
      expect(api.anular).not.toHaveBeenCalled();
    });
  });

  it('(señal de prueba) signal disponible', () => {
    expect(signal(1)()).toBe(1);
  });
});
