import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '@core/http/api-url.token';
import { Transportista } from '@models/transportista.model';
import { paginaDe } from '../../../testing/fabricas';
import { TiposMineralApiService } from './tipos-mineral-api.service';
import { TransportistasApiService } from './transportistas-api.service';
import { VehiculosApiService } from './vehiculos-api.service';

describe('data-access del catálogo', () => {
  let controlador: HttpTestingController;
  const transportista: Transportista = {
    id: 1,
    razon_social: 'Transportes Huallaga',
    ruc: '20123456789',
    activo: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  it('lista con filtros e incluir_inactivos', () => {
    TestBed.inject(VehiculosApiService)
      .listar({ titularidad: 'EXTERNO', placa: null, incluir_inactivos: true }, 3)
      .subscribe();
    controlador
      .expectOne('/api/v1/catalogo/vehiculos/?titularidad=EXTERNO&incluir_inactivos=1&page=3')
      .flush(paginaDe([]));
  });

  it('guarda los vigentes en memoria y los invalida con cada escritura propia (D-F16)', () => {
    const api = TestBed.inject(TransportistasApiService);
    let vigentes: Transportista[] = [];
    api.listarVigentes().subscribe((lista) => (vigentes = lista));
    controlador.expectOne('/api/v1/catalogo/transportistas/?page=1').flush(paginaDe([transportista]));

    api.listarVigentes().subscribe();
    controlador.expectNone('/api/v1/catalogo/transportistas/?page=1');
    expect(vigentes).toEqual([transportista]);

    api.desactivar(1).subscribe();
    controlador
      .expectOne({ method: 'PATCH', url: '/api/v1/catalogo/transportistas/1/desactivar/' })
      .flush(transportista);
    api.listarVigentes().subscribe();
    controlador.expectOne('/api/v1/catalogo/transportistas/?page=1').flush(paginaDe([]));
  });

  it('si la carga de vigentes falla, no queda cacheado el error', () => {
    const api = TestBed.inject(TransportistasApiService);
    api.listarVigentes().subscribe({ error: () => undefined });
    controlador
      .expectOne('/api/v1/catalogo/transportistas/?page=1')
      .flush(null, { status: 500, statusText: 'x' });
    api.listarVigentes().subscribe();
    controlador.expectOne('/api/v1/catalogo/transportistas/?page=1').flush(paginaDe([]));
  });

  it('crea, edita, obtiene y reactiva con las rutas del contrato (§3)', () => {
    const api = TestBed.inject(TiposMineralApiService);
    api.crear({ codigo: 'MOA', nombre: 'Óxido A' }).subscribe();
    api.editar(2, { nombre: 'Óxido B' }).subscribe();
    api.obtener(2).subscribe();
    api.reactivar(2).subscribe();
    controlador.expectOne({ method: 'POST', url: '/api/v1/catalogo/tipos-mineral/' }).flush({});
    controlador.expectOne({ method: 'PATCH', url: '/api/v1/catalogo/tipos-mineral/2/' }).flush({});
    controlador.expectOne({ method: 'GET', url: '/api/v1/catalogo/tipos-mineral/2/' }).flush({});
    controlador.expectOne({ method: 'PATCH', url: '/api/v1/catalogo/tipos-mineral/2/reactivar/' }).flush({});
  });

  it('modifica la tara con su motivo (HU-M02-01 CA11)', () => {
    TestBed.inject(VehiculosApiService)
      .modificarTara(7, { tara_tn: '12.50', motivo: 'Nueva carrocería' })
      .subscribe();
    const peticion = controlador.expectOne({ method: 'PATCH', url: '/api/v1/catalogo/vehiculos/7/tara/' });
    expect(peticion.request.body).toEqual({ tara_tn: '12.50', motivo: 'Nueva carrocería' });
    peticion.flush({});
  });
});
