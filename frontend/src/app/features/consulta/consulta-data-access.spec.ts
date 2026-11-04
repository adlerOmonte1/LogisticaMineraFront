import { DestroyRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { ArchivoDescargado, DescargaService } from '@core/http/descarga.service';
import { FiltroListado } from '@models/consulta.model';
import { ConsultaApiService } from './data-access/consulta-api.service';
import { TicketImagen } from './data-access/ticket-imagen';

const LISTADO_VACIO: FiltroListado = {
  fecha_desde: '',
  fecha_hasta: '',
  tipo_mineral: null,
  titularidad: null,
  estado: null,
  q: '',
};

describe('ConsultaApiService (docs/contrato-api.md §6)', () => {
  let controlador: HttpTestingController;
  let api: ConsultaApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    controlador = TestBed.inject(HttpTestingController);
    api = TestBed.inject(ConsultaApiService);
  });

  afterEach(() => controlador.verify());

  const esperar = (url: string) => controlador.expectOne((p) => p.urlWithParams === url);

  it('la búsqueda envía la clave `placa` aunque esté vacía: es lo que la distingue del listado', () => {
    api.buscar({ placa: '', fecha: '2026-11-03', hasta: '' }).subscribe();
    esperar('/api/v1/consulta/ingresos/?placa=&fecha=2026-11-03&page=1').flush({});
  });

  it('la búsqueda sin ningún criterio también envía `placa`, para que el servidor responda su mensaje (CA06)', () => {
    api.buscar({ placa: '', fecha: '', hasta: '' }).subscribe();
    esperar('/api/v1/consulta/ingresos/?placa=&page=1').flush({});
  });

  it('la búsqueda combina placa parcial, fecha y fecha final, sin espacios', () => {
    api.buscar({ placa: ' V2K ', fecha: '2026-11-01', hasta: '2026-11-03' }, 2).subscribe();
    esperar('/api/v1/consulta/ingresos/?placa=V2K&fecha=2026-11-01&fecha_hasta=2026-11-03&page=2').flush({});
  });

  it('el listado no envía `placa` ni `fecha` (sería una búsqueda) y omite los filtros vacíos', () => {
    api.listar(LISTADO_VACIO).subscribe();
    esperar('/api/v1/consulta/ingresos/?page=1').flush({});
  });

  it('el listado envía los filtros combinados (HU-M07-02 CA02)', () => {
    api
      .listar(
        {
          fecha_desde: '2026-11-01',
          fecha_hasta: '2026-11-03',
          tipo_mineral: 3,
          titularidad: 'EXTERNO',
          estado: 'ANULADO',
          q: '00012',
        },
        2,
      )
      .subscribe();
    esperar(
      '/api/v1/consulta/ingresos/?fecha_desde=2026-11-01&fecha_hasta=2026-11-03&tipo_mineral=3&titularidad=EXTERNO&estado=ANULADO&q=00012&page=2',
    ).flush({});
  });

  it('exportar pide el CSV con los mismos filtros, como Blob, y conserva el nombre del servidor (CA13)', () => {
    let archivo: ArchivoDescargado | undefined;
    api.exportar({ ...LISTADO_VACIO, estado: 'REGISTRADO' }).subscribe((a) => (archivo = a));
    const peticion = esperar('/api/v1/consulta/ingresos/exportar/?estado=REGISTRADO');
    expect(peticion.request.responseType).toBe('blob');
    peticion.flush(new Blob(['a;b']), {
      headers: { 'Content-Disposition': 'attachment; filename="ingresos_20261103.csv"' },
    });
    expect(archivo?.nombre).toBe('ingresos_20261103.csv');
  });

  it('el calendario pide el mes y, si se elige, el día', () => {
    api.calendario(2026, 11).subscribe();
    esperar('/api/v1/consulta/calendario/?anio=2026&mes=11').flush({});
    api.calendario(2026, 11, 3).subscribe();
    esperar('/api/v1/consulta/calendario/?anio=2026&mes=11&dia=3').flush({});
  });

  it('el inicio, el detalle y el ticket tienen su ruta; el ticket es un Blob autenticado (D-F14)', () => {
    api.inicio().subscribe();
    esperar('/api/v1/consulta/inicio/').flush({});
    api.detalleIngreso(331).subscribe();
    esperar('/api/v1/consulta/ingresos/331/').flush({});
    api.ticketIngreso(331).subscribe();
    const ticket = esperar('/api/v1/consulta/ingresos/331/ticket/');
    expect(ticket.request.responseType).toBe('blob');
    ticket.flush(new Blob(['x']));
  });

  it('el servicio es de solo lectura: no escribe nada (RN-M07-09)', () => {
    const metodos = Object.getOwnPropertyNames(ConsultaApiService.prototype);
    expect(metodos.filter((m) => /crear|editar|eliminar|borrar|guardar|anular/i.test(m))).toEqual([]);
  });

  it('un error al exportar llega como ErrorApi con el mensaje del servidor (CA14)', () => {
    const descarga = jasmine.createSpyObj<DescargaService>('DescargaService', ['obtener']);
    descarga.obtener.and.returnValue(throwError(() => new Error('No hay ingresos para exportar')));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api/v1' },
        { provide: DescargaService, useValue: descarga },
      ],
    });
    let mensaje = '';
    TestBed.inject(ConsultaApiService)
      .exportar(LISTADO_VACIO)
      .subscribe({ error: (e: Error) => (mensaje = e.message) });
    expect(mensaje).toBe('No hay ingresos para exportar');
  });
});

describe('TicketImagen', () => {
  let api: jasmine.SpyObj<ConsultaApiService>;
  let destruir: () => void;
  let ticket: TicketImagen;

  beforeEach(() => {
    api = jasmine.createSpyObj<ConsultaApiService>('ConsultaApiService', ['ticketIngreso']);
    api.ticketIngreso.and.returnValue(of(new Blob(['imagen'], { type: 'image/jpeg' })));
    const destroyRef = { onDestroy: (fn: () => void) => (destruir = fn) } as unknown as DestroyRef;
    ticket = new TicketImagen(api, destroyRef);
  });

  it('pide la imagen una sola vez por ingreso y la entrega como URL de objeto', () => {
    ticket.cargar(331);
    ticket.cargar(331);
    expect(api.ticketIngreso).toHaveBeenCalledOnceWith(331);
    expect(ticket.url()).toMatch(/^blob:/);
    expect(ticket.fallo()).toBeFalse();
  });

  it('al cambiar de ingreso libera la URL anterior y pide la nueva', () => {
    const revocar = spyOn(URL, 'revokeObjectURL').and.callThrough();
    ticket.cargar(331);
    const primera = ticket.url();
    ticket.cargar(332);
    expect(revocar).toHaveBeenCalledWith(primera as string);
    expect(api.ticketIngreso).toHaveBeenCalledTimes(2);
  });

  it('si la imagen no se puede traer, lo marca sin lanzar nada (RNF-M07-09)', () => {
    api.ticketIngreso.and.returnValue(throwError(() => new Error('sin red')));
    ticket.cargar(331);
    expect(ticket.fallo()).toBeTrue();
    expect(ticket.url()).toBeNull();
  });

  it('libera la URL al destruirse la pantalla', () => {
    const revocar = spyOn(URL, 'revokeObjectURL').and.callThrough();
    ticket.cargar(331);
    destruir();
    expect(revocar).toHaveBeenCalledTimes(1);
    expect(ticket.url()).toBeNull();
  });
});
