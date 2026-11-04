import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { TiposMineralApiService } from '@core/catalogo/tipos-mineral-api.service';
import { VehiculosApiService } from '@core/catalogo/vehiculos-api.service';
import { SesionService } from '@core/sesion/sesion.service';
import { ErrorApi } from '@models/error-api.model';
import { Ingreso } from '@models/ingreso.model';
import { BorradorIngreso } from '@models/registro-ingreso.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import {
  crearBorrador,
  crearIngreso,
  crearRespuestaLogin,
  crearVehiculo,
  paginaDe,
} from '../../../../testing/fabricas';
import { BorradorLocal, BorradorLocalService } from '../../data-access/borrador-local.service';
import { IngresosApiService } from '../../data-access/ingresos-api.service';
import { RegistroIngresoStore } from './registro-ingreso.store';

describe('RegistroIngresoStore', () => {
  const mineral: TipoMineral = {
    id: 1,
    codigo: 'MOA',
    nombre: 'Óxido',
    unidad_medida: 'TONELADA',
    activo: true,
  };
  const imagen = new Blob(['ticket'], { type: 'image/jpeg' });
  let api: jasmine.SpyObj<IngresosApiService>;
  let local: jasmine.SpyObj<BorradorLocalService>;
  let tipos: jasmine.SpyObj<TiposMineralApiService>;
  let vehiculos: jasmine.SpyObj<VehiculosApiService>;
  let store: RegistroIngresoStore;

  beforeEach(() => {
    api = jasmine.createSpyObj<IngresosApiService>('IngresosApiService', [
      'iniciarBorrador',
      'iniciarBorradorSinFoto',
      'registrar',
    ]);
    local = jasmine.createSpyObj<BorradorLocalService>('BorradorLocalService', [
      'leer',
      'guardar',
      'descartar',
    ]);
    local.leer.and.resolveTo(null);
    local.guardar.and.resolveTo();
    local.descartar.and.resolveTo();
    tipos = jasmine.createSpyObj<TiposMineralApiService>('TiposMineralApiService', ['listarVigentes']);
    tipos.listarVigentes.and.returnValue(of([mineral]));
    vehiculos = jasmine.createSpyObj<VehiculosApiService>('VehiculosApiService', ['listar']);
    TestBed.configureTestingModule({
      providers: [
        RegistroIngresoStore,
        { provide: IngresosApiService, useValue: api },
        { provide: BorradorLocalService, useValue: local },
        { provide: TiposMineralApiService, useValue: tipos },
        { provide: VehiculosApiService, useValue: vehiculos },
      ],
    });
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin('SUPERVISOR', { id: 7 }));
    store = TestBed.inject(RegistroIngresoStore);
  });

  afterEach(() => localStorage.clear());

  const registrado = (): Ingreso & { mensaje: string } => ({
    ...crearIngreso(),
    mensaje: 'Ingreso registrado con el código ING-2026-00331',
  });

  describe('al abrir', () => {
    it('carga los tipos de mineral y busca un registro en curso del usuario', async () => {
      const enCurso = { usuarioId: 7 } as BorradorLocal;
      local.leer.and.resolveTo(enCurso);

      await store.iniciar();

      expect(store.tiposMineral()).toEqual([mineral]);
      expect(local.leer).toHaveBeenCalledWith(7);
      expect(store.pendiente()).toBe(enCurso);
    });

    it('si el catálogo falla, informa y no rompe el registro', async () => {
      tipos.listarVigentes.and.returnValue(
        throwError(() => new ErrorApi(500, 'ERROR_DEL_SERVIDOR', 'falla')),
      );
      await store.iniciar();
      expect(store.errorCatalogo()?.codigo).toBe('ERROR_DEL_SERVIDOR');
    });
  });

  describe('captura', () => {
    it('envía la imagen, pasa a la revisión y guarda el borrador local', async () => {
      const propuesta = crearBorrador();
      api.iniciarBorrador.and.returnValue(of(propuesta));

      await store.capturar(imagen);

      expect(api.iniciarBorrador).toHaveBeenCalledWith(imagen);
      expect(store.paso()).toBe('revision');
      expect(store.propuesta()).toBe(propuesta);
      expect(store.procesando()).toBeFalse();
      expect(store.imagenUrl()).toMatch(/^blob:/);
      expect(store.camposIniciales()).toEqual({
        placa: 'V2K-841',
        fecha: '2026-10-30',
        hora: '16:33',
        peso_bruto_tn: '29.80',
        tipo_mineral: null,
      });
      expect(local.guardar.calls.mostRecent().args[0].paso).toBe('revision');
    });

    it('si el envío falla, la imagen se conserva y se puede reintentar sin volver a fotografiar', async () => {
      api.iniciarBorrador.and.returnValues(
        throwError(() => new ErrorApi(0, 'SIN_CONEXION', 'Sin red')),
        of(crearBorrador()),
      );

      await store.capturar(imagen);
      expect(store.paso()).toBe('captura');
      expect(store.errorCaptura()?.codigo).toBe('SIN_CONEXION');
      expect(store.imagen()).toBe(imagen);
      expect(local.guardar.calls.first().args[0]).toEqual(
        jasmine.objectContaining({ paso: 'captura', imagen, propuesta: null }),
      );

      store.reintentarCaptura();
      expect(api.iniciarBorrador).toHaveBeenCalledTimes(2);
      expect(store.paso()).toBe('revision');
      expect(store.errorCaptura()).toBeNull();
    });

    it('no reintenta si no hay imagen guardada', () => {
      store.reintentarCaptura();
      expect(api.iniciarBorrador).not.toHaveBeenCalled();
    });

    it('el registro sin foto no tiene imagen y conserva el motivo', () => {
      api.iniciarBorradorSinFoto.and.returnValue(
        of(
          crearBorrador({
            sin_respaldo_fotografico: true,
            motivo_sin_respaldo: 'SIN_CAMARA',
            reconocimiento: null,
            vehiculo: null,
            propuesta: {
              placa: null,
              fecha: null,
              peso_bruto_tn: null,
              hora: '08:00',
              hora_es_propuesta: true,
            },
          }),
        ),
      );

      store.capturarSinFoto('SIN_CAMARA');

      expect(api.iniciarBorradorSinFoto).toHaveBeenCalledWith('SIN_CAMARA');
      expect(store.paso()).toBe('revision');
      expect(store.imagen()).toBeNull();
      expect(store.consultaVehiculo()).toBeNull();
      expect(store.camposIniciales().placa).toBe('');
      expect(local.guardar.calls.mostRecent().args[0].sinFoto).toBe('SIN_CAMARA');
    });

    it('un rechazo del servidor en la captura se informa literal', async () => {
      const rechazo = new ErrorApi(
        400,
        'IMAGEN_INVALIDA',
        'La imagen debe estar en formato JPG o PNG y no superar los 10 MB',
      );
      api.iniciarBorrador.and.returnValue(throwError(() => rechazo));
      await store.capturar(imagen);
      expect(store.errorCaptura()).toBe(rechazo);
    });

    it('empezar una captura descarta el aviso de un registro en curso anterior', async () => {
      store.pendiente.set({ usuarioId: 7 } as BorradorLocal);
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      await store.capturar(imagen);
      expect(store.pendiente()).toBeNull();
    });
  });

  describe('registro en curso', () => {
    const enRevision: BorradorLocal = {
      usuarioId: 7,
      paso: 'revision',
      imagen,
      sinFoto: null,
      propuesta: crearBorrador(),
      campos: {
        placa: 'V2K-841',
        fecha: '2026-09-14',
        hora: '08:00',
        peso_bruto_tn: '25.00',
        tipo_mineral: 1,
      },
      justificaciones: { V4: 'autorizado' },
      actualizado: '2026-11-03T16:34:00-05:00',
    };

    it('lo continúa en la revisión con lo que el usuario había editado', () => {
      store.pendiente.set(enRevision);
      store.continuarPendiente();
      expect(store.paso()).toBe('revision');
      expect(store.camposIniciales()).toEqual(enRevision.campos as NonNullable<BorradorLocal['campos']>);
      expect(store.justificacionesIniciales()).toEqual({ V4: 'autorizado' });
      expect(store.consultaVehiculo()?.vehiculo?.placa).toBe('V2K-841');
      expect(store.pendiente()).toBeNull();
    });

    it('si la placa se editó, vuelve a consultar el catálogo en lugar de creer lo anterior', () => {
      store.pendiente.set({
        ...enRevision,
        campos: { ...(enRevision.campos as NonNullable<BorradorLocal['campos']>), placa: 'ZZ3-901' },
      });
      store.continuarPendiente();
      expect(store.consultaVehiculo()).toBeNull();
    });

    it('si solo quedó la imagen sin enviar, queda en la captura listo para reintentar', () => {
      store.pendiente.set({ ...enRevision, paso: 'captura', propuesta: null, campos: null });
      store.continuarPendiente();
      expect(store.paso()).toBe('captura');
      expect(store.imagen()).toBe(imagen);
    });

    it('descartarlo lo borra del dispositivo', () => {
      store.pendiente.set(enRevision);
      store.descartarPendiente();
      expect(store.pendiente()).toBeNull();
      expect(local.descartar).toHaveBeenCalled();
    });

    it('continuar sin registro en curso no hace nada', () => {
      store.continuarPendiente();
      expect(store.paso()).toBe('captura');
    });
  });

  describe('confirmación', () => {
    const campos = {
      placa: 'v2k-841',
      fecha: '2026-09-14',
      hora: '16:33',
      peso_bruto_tn: '25,00',
      tipo_mineral: 1,
    };

    beforeEach(async () => {
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      await store.capturar(imagen);
    });

    it('envía el borrador firmado con el peso normalizado y solo las justificaciones con texto', () => {
      api.registrar.and.returnValue(of(registrado()));

      store.confirmar(campos, { V1: '  ', V4: 'autorizado por el jefe de turno' });

      expect(api.registrar).toHaveBeenCalledWith({
        borrador: 'token-firmado',
        placa: 'V2K-841',
        fecha: '2026-09-14',
        hora: '16:33',
        peso_bruto_tn: '25.00',
        tipo_mineral: 1,
        justificaciones: { V4: 'autorizado por el jefe de turno' },
      });
    });

    it('al registrar muestra el paso 3 y descarta el borrador local y la imagen', () => {
      api.registrar.and.returnValue(of(registrado()));
      store.confirmar(campos, {});
      expect(store.paso()).toBe('confirmado');
      expect(store.registrado()?.codigo).toBe('ING-2026-00331');
      expect(store.imagenUrl()).toBeNull();
      expect(local.descartar).toHaveBeenCalled();
      expect(store.confirmando()).toBeFalse();
    });

    it('un rechazo por inconsistencias se queda en la revisión con todo el detalle', () => {
      const rechazo = new ErrorApi(
        400,
        'INCONSISTENCIAS',
        'Debe indicar la justificación del peso fuera de rango',
        {},
        [],
        [
          {
            regla: 'V4',
            campo: 'peso_bruto_tn',
            mensaje: 'fuera de rango',
            bloqueante: false,
            exige_justificacion: true,
          },
        ],
      );
      api.registrar.and.returnValue(throwError(() => rechazo));

      store.confirmar(campos, {});

      expect(store.paso()).toBe('revision');
      expect(store.errorConfirmacion()).toBe(rechazo);
      expect(local.descartar).not.toHaveBeenCalled();
    });

    it('un borrador ya registrado (409) descarta el borrador local: no se puede reintentar', () => {
      api.registrar.and.returnValue(
        throwError(
          () =>
            new ErrorApi(409, 'BORRADOR_REGISTRADO', 'Este borrador ya se registró como el ingreso ING-1'),
        ),
      );
      store.confirmar(campos, {});
      expect(local.descartar).toHaveBeenCalled();
    });

    it('un tipo de mineral sin elegir lo reclama el servidor, no el cliente', () => {
      api.registrar.and.returnValue(of(registrado()));
      store.confirmar({ ...campos, tipo_mineral: null }, {});
      expect(api.registrar.calls.mostRecent().args[0].tipo_mineral).toBeNull();
    });

    it('sin propuesta no hay nada que confirmar', () => {
      store.nuevo();
      store.confirmar(campos, {});
      expect(api.registrar).not.toHaveBeenCalled();
    });
  });

  describe('vehículo de la placa escrita', () => {
    beforeEach(async () => {
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      await store.capturar(imagen);
    });

    it('la placa reconocida no se vuelve a preguntar: ya la respondió el servidor', fakeAsync(() => {
      store.placaEscrita(' v2k-841 ');
      tick(400);
      expect(vehiculos.listar).not.toHaveBeenCalled();
      expect(store.consultaVehiculo()?.vehiculo?.id).toBe(1);
    }));

    it('otra placa se busca en el catálogo, incluidos los vehículos de baja', fakeAsync(() => {
      vehiculos.listar.and.returnValue(of(paginaDe([crearVehiculo({ placa: 'ABC-123', activo: false })])));
      store.placaEscrita('abc-123');
      tick(400);
      expect(vehiculos.listar).toHaveBeenCalledWith({ placa: 'ABC-123', incluir_inactivos: true });
      expect(store.consultaVehiculo()?.vehiculo?.activo).toBeFalse();
    }));

    it('espera a que se termine de escribir y solo consulta la última placa', fakeAsync(() => {
      vehiculos.listar.and.returnValue(of(paginaDe([])));
      store.placaEscrita('A');
      store.placaEscrita('AB');
      store.placaEscrita('ABC-999');
      tick(400);
      expect(vehiculos.listar).toHaveBeenCalledTimes(1);
      expect(store.consultaVehiculo()).toEqual({ placa: 'ABC-999', vehiculo: null });
    }));

    it('una falla del catálogo no se confunde con «no está registrada»', fakeAsync(() => {
      vehiculos.listar.and.returnValue(throwError(() => new Error('red')));
      store.placaEscrita('QQQ-999');
      tick(400);
      expect(store.consultaVehiculo()).toEqual({ placa: 'QQQ-999', vehiculo: null, fallo: true });
    }));

    it('una placa vacía no consulta', fakeAsync(() => {
      store.placaEscrita('');
      tick(400);
      expect(vehiculos.listar).not.toHaveBeenCalled();
      expect(store.consultaVehiculo()).toEqual({ placa: '', vehiculo: null });
    }));

    it('un vehículo dado de alta desde la revisión se recuerda aunque se cambie la placa y se vuelva', fakeAsync(() => {
      const nuevo = crearVehiculo({ placa: 'ZZ3-901', tara_tn: null, pendiente_destare: true });
      store.vehiculoCreado(nuevo);
      expect(store.consultaVehiculo()?.vehiculo).toBe(nuevo);

      store.placaEscrita('OTRA-111');
      vehiculos.listar.and.returnValue(of(paginaDe([])));
      tick(400);
      store.placaEscrita('zz3-901');
      tick(400);

      expect(store.consultaVehiculo()?.vehiculo).toBe(nuevo);
    }));
  });

  describe('catálogo y reinicio', () => {
    it('un tipo de mineral nuevo recarga la lista para ofrecerlo', () => {
      const otro: TipoMineral = { ...mineral, id: 9, codigo: 'Z9', nombre: 'Nuevo' };
      tipos.listarVigentes.and.returnValue(of([mineral, otro]));
      store.tipoMineralCreado();
      expect(store.tiposMineral()).toEqual([mineral, otro]);
    });

    it('«registrar otro» deja todo limpio y borra el borrador local', async () => {
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      await store.capturar(imagen);
      store.nuevo();
      expect(store.paso()).toBe('captura');
      expect(store.propuesta()).toBeNull();
      expect(store.imagen()).toBeNull();
      expect(store.imagenUrl()).toBeNull();
      expect(store.consultaVehiculo()).toBeNull();
      expect(local.descartar).toHaveBeenCalled();
    });

    it('recordar los campos guarda el borrador en el paso de revisión', async () => {
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      await store.capturar(imagen);
      const campos = {
        placa: 'V2K-841',
        fecha: '2026-09-14',
        hora: '08:00',
        peso_bruto_tn: '25.00',
        tipo_mineral: 1,
      };

      store.recordarCampos(campos, { V4: 'x' });

      const guardado = local.guardar.calls.mostRecent().args[0];
      expect(guardado.campos).toEqual(campos);
      expect(guardado.justificaciones).toEqual({ V4: 'x' });
      expect(guardado.usuarioId).toBe(7);
    });

    it('sin sesión no guarda nada en el dispositivo', async () => {
      TestBed.inject(SesionService).finalizar();
      api.iniciarBorrador.and.returnValue(of(crearBorrador()));
      await store.capturar(imagen);
      expect(local.guardar).not.toHaveBeenCalled();
    });
  });

  it('el envío en curso se refleja mientras el servidor responde', async () => {
    const respuesta = new Subject<BorradorIngreso>();
    api.iniciarBorrador.and.returnValue(respuesta as Observable<BorradorIngreso>);
    const captura = store.capturar(imagen);
    await captura;
    expect(store.procesando()).toBeTrue();
    respuesta.next(crearBorrador());
    respuesta.complete();
    expect(store.procesando()).toBeFalse();
  });
});
