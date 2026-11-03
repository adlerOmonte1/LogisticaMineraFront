import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ErrorApi } from '@models/error-api.model';
import { crearRespuestaLogin } from '../../testing/fabricas';
import { contextoSinSesion } from '../http/contexto-http';
import { NotificacionService } from '../notificacion/notificacion.service';
import { AutenticacionService, RUTA_CAMBIO_CLAVE } from '../sesion/autenticacion.service';
import { SesionService } from '../sesion/sesion.service';
import { erroresInterceptor } from './errores.interceptor';

describe('erroresInterceptor', () => {
  let http: HttpClient;
  let controlador: HttpTestingController;
  let autenticacion: jasmine.SpyObj<AutenticacionService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;
  let router: jasmine.SpyObj<Router>;
  let sesion: SesionService;

  beforeEach(() => {
    autenticacion = jasmine.createSpyObj<AutenticacionService>('AutenticacionService', ['expirarSesion']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', ['error']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
        { provide: AutenticacionService, useValue: autenticacion },
        { provide: NotificacionService, useValue: notificacion },
        { provide: Router, useValue: router },
      ],
    });
    sesion = TestBed.inject(SesionService);
    sesion.iniciar(crearRespuestaLogin());
    http = TestBed.inject(HttpClient);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => localStorage.clear());

  function fallar(
    url: string,
    status: number,
    cuerpo: string | object,
    sinSesion = false,
  ): ErrorApi | undefined {
    let recibido: ErrorApi | undefined;
    http
      .get(url, sinSesion ? { context: contextoSinSesion() } : {})
      .subscribe({ error: (e: ErrorApi) => (recibido = e) });
    controlador.expectOne(url).flush(cuerpo, { status, statusText: 'x' });
    flushMicrotasks();
    return recibido;
  }

  it('entrega siempre un ErrorApi con el mensaje literal', fakeAsync(() => {
    const error = fallar('/api/v1/x/', 409, {
      codigo: 'YA_ANULADO',
      mensaje: 'El ingreso ya fue anulado',
      detalles: {},
    });
    expect(error).toEqual(jasmine.any(ErrorApi));
    expect(error?.mensaje).toBe('El ingreso ya fue anulado');
    expect(notificacion.error).not.toHaveBeenCalled();
  }));

  it('un 401 con sesión expira la sesión con el mensaje del servidor (HU-M01-01 CA06)', fakeAsync(() => {
    fallar('/api/v1/x/', 401, {
      codigo: 'SESION_EXPIRADA',
      mensaje: 'Su sesión ha expirado. Ingrese nuevamente',
      detalles: {},
    });
    expect(autenticacion.expirarSesion).toHaveBeenCalledWith('Su sesión ha expirado. Ingrese nuevamente');
  }));

  it('un 401 del login no expira nada: lo muestra la pantalla', fakeAsync(() => {
    fallar(
      '/api/v1/auth/login/',
      401,
      { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Usuario o contraseña incorrectos', detalles: {} },
      true,
    );
    expect(autenticacion.expirarSesion).not.toHaveBeenCalled();
  }));

  it('la contraseña temporal pendiente lleva a cambiarla (HU-M01-01 CA09)', fakeAsync(() => {
    fallar('/api/v1/x/', 403, {
      codigo: 'CLAVE_TEMPORAL_PENDIENTE',
      mensaje: 'Debe cambiar la contraseña temporal antes de continuar',
      detalles: {},
    });
    expect(sesion.debeCambiarClave()).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_CAMBIO_CLAVE);
  }));

  it('avisa el 403 de rol, la red caída y el 5xx', fakeAsync(() => {
    fallar('/api/v1/a/', 403, {
      codigo: 'ACCION_NO_AUTORIZADA',
      mensaje: 'Acción no autorizada',
      detalles: {},
    });
    fallar('/api/v1/b/', 500, 'error');
    expect(notificacion.error).toHaveBeenCalledWith('Acción no autorizada');
    expect(notificacion.error).toHaveBeenCalledTimes(2);
  }));
});
