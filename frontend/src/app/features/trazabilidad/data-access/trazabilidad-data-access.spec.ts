import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL } from '@core/http/api-url.token';
import { CatalogoRecorridoApiService } from './catalogo-recorrido-api.service';
import { LotesApiService } from './lotes-api.service';

describe('data-access de trazabilidad', () => {
  let controlador: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  it('LotesApiService arma cada ruta y método del contrato (§5.2)', () => {
    const api = TestBed.inject(LotesApiService);
    api.listar({ estado: 'EN_RECORRIDO', tipo_mineral: 3, desde: '2026-11-01', hasta: '' }, 2).subscribe();
    api.obtener(12).subscribe();
    api.abrir({ nombre: 'L1', tipo_mineral: 3, fecha_apertura: '2026-11-02' }).subscribe();
    api.agregarMineral(12, 4).subscribe();
    api.quitarMineral(12, 4).subscribe();
    api.disponibles(12).subscribe();
    api.asignar(12, { ingresos: [331, 332], autorizacion: 'Autorizado' }).subscribe();
    api.retirar(12, 331).subscribe();
    api.iniciarRecorrido(12).subscribe();
    api.registrarEtapa(12, { etapa: 'SECADO' }).subscribe();
    api.secadoPropio(12, 331, { fracciones: [{ parte: 1, fraccion: '1/2' }] }).subscribe();
    api.bigbags(12, { cantidad: 9 }).subscribe();
    api.dividir(12, [{ nombre: 'A', fraccion: '1/2', ruta: 'ZARANDEO_ENSACADO' }]).subscribe();
    api.resumen(12).subscribe();
    api.cerrar(12, { destino: 'VENTA' }).subscribe();

    const esperadas: [string, string][] = [
      ['GET', '/api/v1/lotes/?estado=EN_RECORRIDO&tipo_mineral=3&desde=2026-11-01&page=2'],
      ['GET', '/api/v1/lotes/12/'],
      ['POST', '/api/v1/lotes/'],
      ['POST', '/api/v1/lotes/12/minerales/'],
      ['POST', '/api/v1/lotes/12/minerales/4/quitar/'],
      ['GET', '/api/v1/lotes/12/ingresos/'],
      ['POST', '/api/v1/lotes/12/ingresos/'],
      ['POST', '/api/v1/lotes/12/ingresos/331/retirar/'],
      ['PATCH', '/api/v1/lotes/12/iniciar-recorrido/'],
      ['POST', '/api/v1/lotes/12/etapas/'],
      ['POST', '/api/v1/lotes/12/ingresos/331/secado/'],
      ['POST', '/api/v1/lotes/12/bigbags/'],
      ['POST', '/api/v1/lotes/12/division/'],
      ['GET', '/api/v1/lotes/12/resumen/'],
      ['PATCH', '/api/v1/lotes/12/cerrar/'],
    ];
    for (const [metodo, url] of esperadas) {
      controlador
        .expectOne((peticion) => peticion.method === metodo && peticion.urlWithParams === url)
        .flush({});
    }
  });

  it('el cuerpo de cada operación es el del contrato', () => {
    const api = TestBed.inject(LotesApiService);
    api.asignar(12, { ingresos: [331], autorizacion: 'Autorizado' }).subscribe();
    api.dividir(12, [{ nombre: 'A', fraccion: '1/2', ruta: 'MOLIENDA_ENSACADO' }]).subscribe();
    api.cerrar(12, { destino: 'TRASLADO', observacion: 'A Lima' }).subscribe();
    api.agregarMineral(12, 4).subscribe();

    expect(controlador.expectOne('/api/v1/lotes/12/ingresos/').request.body).toEqual({
      ingresos: [331],
      autorizacion: 'Autorizado',
    });
    expect(controlador.expectOne('/api/v1/lotes/12/division/').request.body).toEqual({
      partes: [{ nombre: 'A', fraccion: '1/2', ruta: 'MOLIENDA_ENSACADO' }],
    });
    expect(controlador.expectOne('/api/v1/lotes/12/cerrar/').request.body).toEqual({
      destino: 'TRASLADO',
      observacion: 'A Lima',
    });
    expect(controlador.expectOne('/api/v1/lotes/12/minerales/').request.body).toEqual({ tipo_mineral: 4 });
  });

  it('un valor ausente no se envía como null: el servidor responde con su mensaje, no «Datos inválidos»', () => {
    const api = TestBed.inject(LotesApiService);
    api.agregarMineral(12, null).subscribe();
    api.cerrar(12, { destino: null, observacion: 'x' }).subscribe();
    expect(controlador.expectOne('/api/v1/lotes/12/minerales/').request.body).toEqual({});
    expect(controlador.expectOne('/api/v1/lotes/12/cerrar/').request.body).toEqual({ observacion: 'x' });
  });

  it('ninguna operación del servicio elimina (D-22)', () => {
    const metodos = Object.getOwnPropertyNames(LotesApiService.prototype);
    expect(metodos.filter((nombre) => /eliminar|borrar|delete/i.test(nombre))).toEqual([]);
  });

  describe('CatalogoRecorridoApiService', () => {
    const etapas = [{ codigo: 'SECADO', nombre: 'Secado', orden: 1 }];
    const rutas = { rutas: [], destinos: [{ codigo: 'VENTA', nombre: 'Venta' }] };

    it('pide etapas y rutas una sola vez para toda la sesión', () => {
      const catalogo = TestBed.inject(CatalogoRecorridoApiService);
      const recibidos: unknown[] = [];
      catalogo.catalogo().subscribe((c) => recibidos.push(c));
      catalogo.catalogo().subscribe((c) => recibidos.push(c));

      controlador.expectOne('/api/v1/etapas/').flush(etapas);
      controlador.expectOne('/api/v1/rutas/').flush(rutas);
      expect(recibidos.length).toBe(2);
      expect(recibidos[0]).toEqual({ etapas, ...rutas } as never);

      catalogo.catalogo().subscribe((c) => recibidos.push(c));
      controlador.expectNone('/api/v1/etapas/');
      expect(recibidos.length).toBe(3);
    });

    it('un fallo no se queda en la caché: el siguiente intento vuelve a pedir', () => {
      const catalogo = TestBed.inject(CatalogoRecorridoApiService);
      let fallos = 0;
      catalogo.catalogo().subscribe({ error: () => fallos++ });
      controlador.expectOne('/api/v1/etapas/').flush({}, { status: 500, statusText: 'Error' });
      // Al fallar las etapas, forkJoin cancela la otra petición.
      expect(controlador.match('/api/v1/rutas/').every((p) => p.cancelled)).toBeTrue();
      expect(fallos).toBe(1);

      catalogo.catalogo().subscribe();
      controlador.expectOne('/api/v1/etapas/').flush(etapas);
      controlador.expectOne('/api/v1/rutas/').flush(rutas);
    });
  });
});
