import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { crearRespuestaLogin } from '../../testing/fabricas';
import { API_URL } from '../http/api-url.token';
import { contextoSinSesion } from '../http/contexto-http';
import { autenticacionInterceptor } from './autenticacion.interceptor';
import { RenovacionSesionService } from './renovacion-sesion.service';
import { SesionService } from './sesion.service';

describe('autenticacionInterceptor', () => {
  let http: HttpClient;
  let controlador: HttpTestingController;
  let renovacion: jasmine.SpyObj<RenovacionSesionService>;

  beforeEach(() => {
    renovacion = jasmine.createSpyObj<RenovacionSesionService>('RenovacionSesionService', [
      'renovarSiCorresponde',
    ]);
    renovacion.renovarSiCorresponde.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([autenticacionInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' },
        { provide: RenovacionSesionService, useValue: renovacion },
      ],
    });
    TestBed.inject(SesionService).iniciar({ ...crearRespuestaLogin(), access: 'token-actual' });
    http = TestBed.inject(HttpClient);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controlador.verify();
    localStorage.clear();
  });

  it('adjunta el token a la API propia, después de revisar la renovación', () => {
    http.get('/api/v1/usuarios/').subscribe();
    const peticion = controlador.expectOne('/api/v1/usuarios/');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-actual');
    expect(renovacion.renovarSiCorresponde).toHaveBeenCalled();
    peticion.flush({});
  });

  it('nunca envía el token a un tercero', () => {
    http.get('https://fonts.googleapis.com/css').subscribe();
    const peticion = controlador.expectOne('https://fonts.googleapis.com/css');
    expect(peticion.request.headers.has('Authorization')).toBeFalse();
    peticion.flush({});
  });

  it('no toca las peticiones marcadas sin sesión (login, logout)', () => {
    http.post('/api/v1/auth/login/', {}, { context: contextoSinSesion() }).subscribe();
    const peticion = controlador.expectOne('/api/v1/auth/login/');
    expect(peticion.request.headers.has('Authorization')).toBeFalse();
    expect(renovacion.renovarSiCorresponde).not.toHaveBeenCalled();
    peticion.flush({});
  });
});
