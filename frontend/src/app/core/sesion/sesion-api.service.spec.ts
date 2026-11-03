import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '../http/api-url.token';
import { PETICION_SIN_SESION } from '../http/contexto-http';
import { SesionApiService } from './sesion-api.service';

describe('SesionApiService', () => {
  let api: SesionApiService;
  let controlador: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    api = TestBed.inject(SesionApiService);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  it('inicia sesión marcando la petición como sin sesión', () => {
    api.iniciar({ username: 'u', password: 'p' }).subscribe();
    const peticion = controlador.expectOne('/api/v1/auth/login/');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.context.get(PETICION_SIN_SESION)).toBeTrue();
    peticion.flush({});
  });

  it('cierra la sesión enviando el refresh', () => {
    api.cerrar('r').subscribe();
    const peticion = controlador.expectOne('/api/v1/auth/logout/');
    expect(peticion.request.body).toEqual({ refresh: 'r' });
    peticion.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('renueva y devuelve solo el access', () => {
    let access = '';
    api.renovar('r').subscribe((valor) => (access = valor));
    controlador.expectOne('/api/v1/auth/refresh/').flush({ access: 'nuevo' });
    expect(access).toBe('nuevo');
  });
});
