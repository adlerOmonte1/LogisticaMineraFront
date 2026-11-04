import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '@core/http/api-url.token';
import { BorradorLocal, BorradorLocalService } from './borrador-local.service';
import { IngresosApiService, nombreDeArchivo } from './ingresos-api.service';

describe('IngresosApiService', () => {
  let api: IngresosApiService;
  let controlador: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    api = TestBed.inject(IngresosApiService);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  it('envía la imagen del borrador como multipart, sin otros campos', () => {
    api.iniciarBorrador(new Blob(['x'], { type: 'image/png' })).subscribe();
    const peticion = controlador.expectOne('/api/v1/ingresos/borradores/');
    const cuerpo = peticion.request.body as FormData;
    expect(peticion.request.method).toBe('POST');
    expect((cuerpo.get('imagen') as File).name).toBe('ticket.png');
    expect(cuerpo.has('sin_foto')).toBeFalse();
    peticion.flush({});
  });

  it('el registro sin foto envía el motivo de la lista cerrada', () => {
    api.iniciarBorradorSinFoto('SIN_CAMARA').subscribe();
    const peticion = controlador.expectOne('/api/v1/ingresos/borradores/');
    const cuerpo = peticion.request.body as FormData;
    expect(cuerpo.get('sin_foto')).toBe('true');
    expect(cuerpo.get('motivo_sin_respaldo')).toBe('SIN_CAMARA');
    expect(cuerpo.has('imagen')).toBeFalse();
    peticion.flush({});
  });

  it('arma cada operación sobre un ingreso con su método y ruta (§4)', () => {
    api
      .registrar({
        borrador: 'b',
        placa: 'A',
        fecha: 'f',
        hora: 'h',
        peso_bruto_tn: '1',
        tipo_mineral: 1,
        justificaciones: {},
      })
      .subscribe();
    api.obtener(7).subscribe();
    api.corregir(7, { motivo: 'm', placa: 'B' }).subscribe();
    api.revertirCorreccion(7, { motivo: 'm', correccion: 9 }).subscribe();
    api.anular(7, 'm').subscribe();
    api.pendientesDestare().subscribe();
    api.registrarDestare({ vehiculo: 3, tara_tn: '5.00' }).subscribe();

    const esperadas: [string, string][] = [
      ['POST', '/api/v1/ingresos/'],
      ['GET', '/api/v1/ingresos/7/'],
      ['PATCH', '/api/v1/ingresos/7/'],
      ['POST', '/api/v1/ingresos/7/revertir-correccion/'],
      ['PATCH', '/api/v1/ingresos/7/anular/'],
      ['GET', '/api/v1/ingresos/'],
      ['POST', '/api/v1/ingresos/destares/'],
    ];
    for (const [metodo, url] of esperadas) {
      controlador.expectOne((p) => p.method === metodo && p.url === url).flush({});
    }
  });

  it('nombra el archivo según el contenido cuando no es un File', () => {
    expect(nombreDeArchivo(new Blob([], { type: 'image/png' }))).toBe('ticket.png');
    expect(nombreDeArchivo(new Blob([], { type: 'image/jpeg' }))).toBe('ticket.jpg');
    expect(nombreDeArchivo(new File([], 'foto.jpg'))).toBe('foto.jpg');
  });
});

describe('BorradorLocalService', () => {
  const borrador: BorradorLocal = {
    usuarioId: 5,
    paso: 'revision',
    imagen: new Blob(['imagen'], { type: 'image/jpeg' }),
    sinFoto: null,
    propuesta: null,
    campos: { placa: 'ABC-123', fecha: '2026-11-03', hora: '08:00', peso_bruto_tn: '29.80', tipo_mineral: 1 },
    justificaciones: { V4: 'autorizado' },
    actualizado: '2026-11-03T08:00:00-05:00',
  };
  let servicio: BorradorLocalService;

  beforeEach(async () => {
    servicio = TestBed.inject(BorradorLocalService);
    await servicio.descartar();
  });

  afterEach(async () => servicio.descartar());

  it('guarda y recupera el registro en curso del usuario, con su imagen', async () => {
    await servicio.guardar(borrador);
    const leido = await servicio.leer(5);
    expect(leido?.campos).toEqual(borrador.campos);
    expect(leido?.justificaciones).toEqual({ V4: 'autorizado' });
    expect(await leido?.imagen?.text()).toBe('imagen');
  });

  it('no entrega el borrador de otro usuario y lo descarta', async () => {
    await servicio.guardar(borrador);
    expect(await servicio.leer(99)).toBeNull();
    expect(await servicio.leer(5)).toBeNull();
  });

  it('descartar deja sin borrador, y sin borrador devuelve null', async () => {
    expect(await servicio.leer(5)).toBeNull();
    await servicio.guardar(borrador);
    await servicio.descartar();
    expect(await servicio.leer(5)).toBeNull();
  });
});
