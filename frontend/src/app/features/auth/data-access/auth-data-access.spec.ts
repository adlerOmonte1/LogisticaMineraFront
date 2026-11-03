import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '@core/http/api-url.token';
import { CuentaApiService } from './cuenta-api.service';
import { UsuariosApiService } from './usuarios-api.service';

describe('data-access de auth', () => {
  let controlador: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  it('UsuariosApiService arma cada ruta y método del contrato (§2.2)', () => {
    const api = TestBed.inject(UsuariosApiService);
    api.listar({ rol: 'SUPERVISOR', incluir_inactivos: true }, 2).subscribe();
    api.obtener(4).subscribe();
    api.crear({ username: 'u', nombres: 'n', apellidos: 'a', password: 'p', rol: 'SUPERVISOR' }).subscribe();
    api.editar(4, { rol: 'ADMINISTRATIVO' }).subscribe();
    api.desactivar(4).subscribe();
    api.reactivar(4).subscribe();
    api.restablecerClave(4).subscribe();

    const esperadas: [string, string][] = [
      ['GET', '/api/v1/usuarios/?rol=SUPERVISOR&incluir_inactivos=1&page=2'],
      ['GET', '/api/v1/usuarios/4/'],
      ['POST', '/api/v1/usuarios/'],
      ['PATCH', '/api/v1/usuarios/4/'],
      ['PATCH', '/api/v1/usuarios/4/desactivar/'],
      ['PATCH', '/api/v1/usuarios/4/reactivar/'],
      ['POST', '/api/v1/usuarios/4/restablecer-clave/'],
    ];
    for (const [metodo, url] of esperadas) {
      controlador
        .expectOne((peticion) => peticion.method === metodo && peticion.urlWithParams === url)
        .flush({});
    }
  });

  it('CuentaApiService cambia la propia clave', () => {
    const cambio = { password_actual: 'a', password_nueva: 'b', password_nueva_confirmacion: 'b' };
    TestBed.inject(CuentaApiService).cambiarClave(cambio).subscribe();
    const peticion = controlador.expectOne('/api/v1/usuarios/cambiar-clave/');
    expect(peticion.request.body).toEqual(cambio);
    peticion.flush({ mensaje: 'ok' });
  });
});
