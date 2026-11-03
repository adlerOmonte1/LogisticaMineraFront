import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { paginaDe } from '../../testing/fabricas';
import { recorrerPaginas } from './paginacion';

describe('recorrerPaginas', () => {
  let http: HttpClient;
  let controlador: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  it('pide ?page=n+1 sobre la misma ruta mientras haya next, sin seguir la URL absoluta', () => {
    let filas: number[] = [];
    recorrerPaginas<number>(http, '/api/v1/catalogo/vehiculos/').subscribe(
      (resultado) => (filas = resultado),
    );

    controlador
      .expectOne('/api/v1/catalogo/vehiculos/?page=1')
      .flush(paginaDe([1, 2], 'http://otro-host:8000/api/v1/catalogo/vehiculos/?page=2'));
    controlador
      .expectOne('/api/v1/catalogo/vehiculos/?page=2')
      .flush(paginaDe([3], 'http://otro-host/?page=3'));
    controlador.expectOne('/api/v1/catalogo/vehiculos/?page=3').flush(paginaDe([4]));

    expect(filas).toEqual([1, 2, 3, 4]);
  });
});
