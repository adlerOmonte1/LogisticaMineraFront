import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { SesionService } from '@core/sesion/sesion.service';
import { DetalleIngreso } from '@models/detalle-ingreso.model';
import { ErrorApi } from '@models/error-api.model';
import { Rol } from '@models/rol.model';
import { crearDetalle, crearRespuestaLogin } from '../../testing/fabricas';
import { estabilizar } from '../../testing/estabilizar';
import { ConsultaApiService } from './data-access/consulta-api.service';
import { DetalleIngresoPage } from './pages/detalle-ingreso/detalle-ingreso.page';
import { CabeceraIngresoComponent } from './ui/cabecera-ingreso/cabecera-ingreso.component';
import { PestanaDatosComponent } from './ui/pestana-datos/pestana-datos.component';
import { PestanaReconocimientoComponent } from './ui/pestana-reconocimiento/pestana-reconocimiento.component';
import { PestanaTicketComponent } from './ui/pestana-ticket/pestana-ticket.component';
import { PestanaValidacionComponent } from './ui/pestana-validacion/pestana-validacion.component';

describe('ConsultaApiService', () => {
  it('pide el detalle completo y el ticket como Blob autenticado (D-F14)', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    const api = TestBed.inject(ConsultaApiService);
    const controlador = TestBed.inject(HttpTestingController);

    api.detalleIngreso(331).subscribe();
    controlador.expectOne({ method: 'GET', url: '/api/v1/consulta/ingresos/331/' }).flush({});
    api.ticketIngreso(331).subscribe();
    const ticket = controlador.expectOne('/api/v1/consulta/ingresos/331/ticket/');
    expect(ticket.request.responseType).toBe('blob');
    ticket.flush(new Blob(['x']));
    controlador.verify();
  });
});

describe('CabeceraIngresoComponent (acciones por rol)', () => {
  afterEach(() => localStorage.clear());

  function acciones(rol: Rol, detalle: DetalleIngreso): string[] {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideNoopAnimations()] });
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin(rol));
    const fixture = TestBed.createComponent(CabeceraIngresoComponent);
    fixture.componentRef.setInput('detalle', detalle);
    estabilizar(fixture);
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-prueba]')]
      .map((e) => e.getAttribute('data-prueba') ?? '')
      .filter((nombre) => nombre !== 'codigo');
  }

  it('el Administrador corrige y anula; revierte solo si hay una corrección vigente', () => {
    expect(acciones('ADMINISTRADOR', crearDetalle())).toEqual(['corregir', 'anular']);
    expect(acciones('ADMINISTRADOR', crearDetalle({ correccion_revertible: 55 }))).toEqual([
      'corregir',
      'revertir',
      'anular',
    ]);
  });

  it('el Administrativo corrige y revierte, pero no anula (HU-M03-03 CA04)', () => {
    expect(acciones('ADMINISTRATIVO', crearDetalle({ correccion_revertible: 55 }))).toEqual([
      'corregir',
      'revertir',
    ]);
  });

  it('el Supervisor no ve ninguna acción (HU-M03-02 CA06, HU-M04-02 CA04)', () => {
    expect(acciones('SUPERVISOR', crearDetalle({ correccion_revertible: 55 }))).toEqual([]);
  });

  it('un ingreso anulado ya no ofrece acciones, y muestra su estado', () => {
    expect(acciones('ADMINISTRADOR', crearDetalle({ estado: 'ANULADO', correccion_revertible: 55 }))).toEqual(
      [],
    );
  });

  it('el ingreso sin foto lleva su marca en la cabecera (CA17)', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideNoopAnimations()] });
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin('SUPERVISOR'));
    const fixture = TestBed.createComponent(CabeceraIngresoComponent);
    fixture.componentRef.setInput(
      'detalle',
      crearDetalle({ sin_respaldo_fotografico: true, motivo_sin_respaldo_texto: 'Sin cámara' }),
    );
    estabilizar(fixture);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin respaldo fotográfico');
  });
});

describe('Pestañas del detalle', () => {
  function montar<T>(componente: new () => T, entradas: Record<string, unknown>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(componente);
    for (const [nombre, valor] of Object.entries(entradas)) {
      fixture.componentRef.setInput(nombre, valor);
    }
    estabilizar(fixture);
    return fixture.nativeElement as HTMLElement;
  }

  it('Datos: tres marcas de tiempo distintas, tara y neto de solo lectura (HU-M03-01 CA09)', () => {
    const raiz = montar(PestanaDatosComponent, { detalle: crearDetalle() });
    expect(raiz.querySelector('[data-prueba="pesaje"]')?.textContent).toBe('14/09/2026 16:33');
    expect(raiz.querySelector('[data-prueba="inicio"]')?.textContent).toBe('03/11/2026 16:33');
    expect(raiz.querySelector('[data-prueba="fin"]')?.textContent).toBe('03/11/2026 16:37');
    expect(raiz.querySelector('[data-prueba="peso-neto"]')?.textContent?.trim()).toBe('13.20 t');
    expect(raiz.querySelector('input, textarea, select')).toBeNull();
  });

  it('Datos: un ingreso En proceso dice que el neto espera el destare (HU-M07-01 CA08)', () => {
    const raiz = montar(PestanaDatosComponent, {
      detalle: crearDetalle({ estado: 'EN_PROCESO', tara_tn: null, peso_neto_tn: null }),
    });
    expect(raiz.querySelector('[data-prueba="peso-neto"]')?.textContent).toContain('Pendiente del destare');
  });

  it('Datos: un ingreso anulado muestra motivo y responsable; uno sin foto, su motivo (CA05, CA17)', () => {
    const raiz = montar(PestanaDatosComponent, {
      detalle: crearDetalle({
        estado: 'ANULADO',
        motivo_anulacion: 'Ticket duplicado',
        anulado_por: 'admin.prueba',
        sin_respaldo_fotografico: true,
        motivo_sin_respaldo_texto: 'Sin cámara',
      }),
    });
    expect(raiz.querySelector('[data-prueba="anulacion"]')?.textContent).toContain('Ticket duplicado');
    expect(raiz.querySelector('[data-prueba="anulacion"]')?.textContent).toContain('admin.prueba');
    expect(raiz.querySelector('[data-prueba="motivo-sin-foto"]')?.textContent).toBe('Sin cámara');
  });

  it('Ticket: la imagen, el motivo de su ausencia o el aviso de que no se puede recuperar (RN-M07-04)', () => {
    const imagen = montar(PestanaTicketComponent, {
      respaldo: { tipo: 'IMAGEN', url: 'x' },
      urlImagen: 'blob:x',
    });
    expect(imagen.querySelector('app-visor-imagen img')).not.toBeNull();
    const cargando = montar(PestanaTicketComponent, {
      respaldo: { tipo: 'IMAGEN', url: 'x' },
      urlImagen: null,
    });
    expect(cargando.textContent).toContain('Cargando imagen');
    const fallo = montar(PestanaTicketComponent, {
      respaldo: { tipo: 'IMAGEN', url: 'x' },
      falloImagen: true,
    });
    expect(fallo.textContent).toContain('No se pudo cargar la imagen');
    const sinFoto = montar(PestanaTicketComponent, {
      respaldo: { tipo: 'SIN_RESPALDO_FOTOGRAFICO', url: null, motivo: 'Ticket extraviado' },
    });
    expect(sinFoto.querySelector('[data-prueba="sin-respaldo"]')?.textContent).toContain('Ticket extraviado');
    const perdido = montar(PestanaTicketComponent, {
      respaldo: { tipo: 'NO_DISPONIBLE', url: null, mensaje: 'El respaldo no está disponible' },
    });
    expect(perdido.querySelector('[data-prueba="no-disponible"]')?.textContent).toContain(
      'El respaldo no está disponible',
    );
  });

  it('Reconocimiento: reconocido frente a confirmado, el campo corregido señalado, motor y versión (HU-M04-02)', () => {
    const detalle = crearDetalle();
    const raiz = montar(PestanaReconocimientoComponent, { reconocimiento: detalle.reconocimiento });
    expect(raiz.querySelector('[data-prueba="motor"]')?.textContent).toContain('tesseract-local');
    expect(raiz.querySelector('[data-prueba="motor"]')?.textContent).toContain('5.5.0');
    const filas = [...raiz.querySelectorAll('tr.mat-mdc-row')].map((f) =>
      f.textContent?.replace(/\s+/g, ' '),
    );
    expect(filas.length).toBe(3);
    expect(filas[1]).toContain('Fecha');
    expect(filas[1]).toContain('Corregido');
    expect(filas[1]).toContain('2026-10-30');
    expect(filas[1]).toContain('2026-09-14');
    expect(filas[0]).not.toContain('Corregido');
    expect(filas[0]).toContain('Lectura con baja confianza');
  });

  it('Reconocimiento: un ingreso sin reconocimiento dice por qué (CA03)', () => {
    const raiz = montar(PestanaReconocimientoComponent, {
      reconocimiento: { disponible: false, mensaje: 'Registrado sin fotografía del ticket' },
    });
    expect(raiz.querySelector('[data-prueba="sin-reconocimiento"]')?.textContent).toContain(
      'Registrado sin fotografía del ticket',
    );
  });

  it('Validación: cada regla con su resultado, la justificación y las que esperan el destare', () => {
    const raiz = montar(PestanaValidacionComponent, { validaciones: crearDetalle().validaciones });
    const filas = [...raiz.querySelectorAll('tr.mat-mdc-row')].map((f) =>
      f.textContent?.replace(/\s+/g, ' '),
    );
    expect(filas[0]).toContain('Cumple');
    expect(filas[0]).toContain('Ticket no duplicado');
    expect(filas[1]).toContain('Justificada');
    expect(filas[1]).toContain('Carga autorizada');
    expect(filas[2]).toContain('Se evalúa en el destare');
  });

  it('Validación: un bloque ausente se indica, no se omite (RN-M07-08)', () => {
    const raiz = montar(PestanaValidacionComponent, {
      validaciones: { disponible: false, mensaje: 'El ingreso no tiene validaciones registradas' },
    });
    expect(raiz.querySelector('[data-prueba="sin-validaciones"]')?.textContent).toContain(
      'no tiene validaciones registradas',
    );
  });
});

describe('DetalleIngresoPage', () => {
  let api: jasmine.SpyObj<ConsultaApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ConsultaApiService>('ConsultaApiService', ['detalleIngreso', 'ticketIngreso']);
    api.detalleIngreso.and.returnValue(of(crearDetalle()));
    api.ticketIngreso.and.returnValue(of(new Blob(['imagen'], { type: 'image/jpeg' })));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideNoopAnimations(), { provide: ConsultaApiService, useValue: api }],
    });
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin('ADMINISTRADOR'));
  });

  afterEach(() => localStorage.clear());

  function montar(pestana?: string) {
    const fixture = TestBed.createComponent(DetalleIngresoPage);
    fixture.componentRef.setInput('id', '331');
    fixture.componentRef.setInput('pestana', pestana);
    estabilizar(fixture);
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  it('carga el detalle una sola vez y abre en Datos por defecto', () => {
    const { raiz } = montar();
    expect(api.detalleIngreso).toHaveBeenCalledOnceWith(331);
    expect(raiz.querySelector('app-pestana-datos')).not.toBeNull();
    expect(raiz.querySelector('[data-prueba="codigo"]')?.textContent).toBe('ING-2026-00331');
  });

  it('cada pestaña es una ruta y una pestaña desconocida cae en Datos', () => {
    expect(montar('reconocimiento').raiz.querySelector('app-pestana-reconocimiento')).not.toBeNull();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideNoopAnimations(), { provide: ConsultaApiService, useValue: api }],
    });
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin('ADMINISTRADOR'));
    expect(montar('inexistente').raiz.querySelector('app-pestana-datos')).not.toBeNull();
  });

  it('la imagen se descarga solo al abrir la pestaña del ticket, y una vez', () => {
    const { fixture, raiz } = montar();
    expect(api.ticketIngreso).not.toHaveBeenCalled();

    fixture.componentRef.setInput('pestana', 'ticket');
    estabilizar(fixture);
    fixture.componentRef.setInput('pestana', 'datos');
    estabilizar(fixture);
    fixture.componentRef.setInput('pestana', 'ticket');
    estabilizar(fixture);

    expect(api.ticketIngreso).toHaveBeenCalledOnceWith(331);
    expect(raiz.querySelector('app-visor-imagen img')?.getAttribute('src')).toMatch(/^blob:/);
  });

  it('si la imagen no se puede traer, lo dice y el resto del detalle sigue disponible (RNF-M07-09)', () => {
    api.ticketIngreso.and.returnValue(throwError(() => new ErrorApi(0, 'SIN_CONEXION', 'sin red')));
    const { raiz } = montar('ticket');
    expect(raiz.textContent).toContain('No se pudo cargar la imagen');
    expect(raiz.querySelector('[data-prueba="codigo"]')).not.toBeNull();
  });

  it('un ingreso sin foto no pide ninguna imagen', () => {
    api.detalleIngreso.and.returnValue(
      of(
        crearDetalle({
          respaldo: { tipo: 'SIN_RESPALDO_FOTOGRAFICO', url: null, motivo: 'Ticket extraviado' },
        }),
      ),
    );
    montar('ticket');
    expect(api.ticketIngreso).not.toHaveBeenCalled();
  });

  it('si el ingreso no existe, muestra el error literal y ninguna pestaña', () => {
    api.detalleIngreso.and.returnValue(throwError(() => new ErrorApi(404, 'ERROR', 'No encontrado')));
    const { raiz } = montar();
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain('No encontrado');
    expect(raiz.querySelector('app-pestana-datos')).toBeNull();
  });
});
