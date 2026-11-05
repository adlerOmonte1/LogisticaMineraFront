import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ErrorApi } from '@models/error-api.model';
import { crearAviso } from '../../testing/fabricas';
import { estabilizar } from '../../testing/estabilizar';
import { AvisosService } from '../consulta/avisos.service';
import { ConsultaCabeceraApiService } from '../consulta/consulta-cabecera-api.service';
import { API_URL } from '../http/api-url.token';
import { NotificacionService } from '../notificacion/notificacion.service';
import { BusquedaCabeceraComponent } from './busqueda-cabecera/busqueda-cabecera.component';
import { CampanaAvisosComponent } from './campana-avisos/campana-avisos.component';

@Component({ standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, template: '' })
class PaginaVaciaComponent {}

describe('ConsultaCabeceraApiService', () => {
  it('busca con `q` y pide los avisos (docs/contrato-api.md §6)', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    const servicio = TestBed.inject(ConsultaCabeceraApiService);
    const controlador = TestBed.inject(HttpTestingController);

    servicio.buscar('00012').subscribe();
    controlador.expectOne((p) => p.urlWithParams === '/api/v1/consulta/cabecera/?q=00012').flush({});
    servicio.avisos().subscribe();
    controlador.expectOne('/api/v1/consulta/avisos/').flush({});
    controlador.verify();
  });
});

describe('AvisosService', () => {
  let api: jasmine.SpyObj<ConsultaCabeceraApiService>;
  let servicio: AvisosService;

  beforeEach(() => {
    api = jasmine.createSpyObj<ConsultaCabeceraApiService>('ConsultaCabeceraApiService', ['avisos']);
    TestBed.configureTestingModule({ providers: [{ provide: ConsultaCabeceraApiService, useValue: api }] });
    servicio = TestBed.inject(AvisosService);
  });

  it('guarda los avisos del servidor y su mensaje cuando no hay nada', () => {
    api.avisos.and.returnValue(of({ cantidad: 1, avisos: [crearAviso()], mensaje: null }));
    servicio.recargar();
    expect(servicio.avisos().length).toBe(1);
    expect(servicio.mensaje()).toBeNull();

    api.avisos.and.returnValue(of({ cantidad: 0, avisos: [], mensaje: 'No hay nada pendiente' }));
    servicio.recargar();
    expect(servicio.avisos()).toEqual([]);
    expect(servicio.mensaje()).toBe('No hay nada pendiente');
  });

  it('si falla, conserva lo que tenía y lo marca como desactualizado', () => {
    api.avisos.and.returnValue(of({ cantidad: 1, avisos: [crearAviso()], mensaje: null }));
    servicio.recargar();
    api.avisos.and.returnValue(throwError(() => new Error('sin red')));
    servicio.recargar();
    expect(servicio.avisos().length).toBe(1);
    expect(servicio.fallo()).toBeTrue();
    expect(servicio.cargando()).toBeFalse();
  });

  it('limpiar no deja nada del usuario anterior', () => {
    api.avisos.and.returnValue(of({ cantidad: 1, avisos: [crearAviso()], mensaje: null }));
    servicio.recargar();
    servicio.limpiar();
    expect(servicio.avisos()).toEqual([]);
    expect(servicio.mensaje()).toBeNull();
    expect(servicio.fallo()).toBeFalse();
  });
});

describe('CampanaAvisosComponent (HU-M07-04 CA06 a CA10)', () => {
  let api: jasmine.SpyObj<ConsultaCabeceraApiService>;

  function montar(avisos = [crearAviso()], mensaje: string | null = null) {
    api = jasmine.createSpyObj<ConsultaCabeceraApiService>('ConsultaCabeceraApiService', ['avisos']);
    api.avisos.and.returnValue(of({ cantidad: avisos.length, avisos, mensaje }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'otra', component: PaginaVaciaComponent }]),
        provideNoopAnimations(),
        { provide: ConsultaCabeceraApiService, useValue: api },
      ],
    });
    const fixture = TestBed.createComponent(CampanaAvisosComponent);
    estabilizar(fixture);
    return { fixture, raiz: fixture.nativeElement as HTMLElement };
  }

  const abrirPanel = (raiz: HTMLElement, fixture: { detectChanges: () => void }) => {
    raiz.querySelector<HTMLButtonElement>('[data-prueba="campana"]')?.click();
    fixture.detectChanges();
  };

  it('muestra el contador de avisos pendientes, también en su etiqueta accesible', () => {
    const { raiz } = montar([crearAviso(), crearAviso({ tipo: 'SIN_LOTE', enlace: '/lotes' })]);
    expect(raiz.querySelector('.mat-badge-content')?.textContent?.trim()).toBe('2');
    expect(raiz.querySelector('button')?.getAttribute('aria-label')).toBe('Avisos: 2 pendientes');
  });

  it('con más de nueve avisos el contador dice «9+»', () => {
    const { raiz } = montar(Array.from({ length: 12 }, () => crearAviso()));
    expect(raiz.querySelector('.mat-badge-content')?.textContent?.trim()).toBe('9+');
  });

  it('sin avisos no hay contador y el panel dice el mensaje del servidor (CA09)', () => {
    const { fixture, raiz } = montar([], 'No hay nada pendiente');
    expect(raiz.querySelector('button')?.getAttribute('aria-label')).toBe('Avisos: nada pendiente');
    abrirPanel(raiz, fixture);
    expect(document.querySelector('[data-prueba="sin-avisos"]')?.textContent).toContain(
      'No hay nada pendiente',
    );
  });

  it('cada aviso lleva con un paso a la pantalla que el servidor indica (CA06, CA07)', () => {
    const { fixture, raiz } = montar([
      crearAviso(),
      crearAviso({
        tipo: 'LOTE_LISTO',
        titulo: 'Lote A listo para cerrar con su destino',
        enlace: '/lotes/12/cerrar',
      }),
    ]);
    abrirPanel(raiz, fixture);
    const enlaces = [...document.querySelectorAll('[data-prueba="aviso"]')].map((a) =>
      a.getAttribute('href'),
    );
    expect(enlaces).toEqual(['/ingresos/destares', '/lotes/12/cerrar']);
    expect(
      [...document.querySelectorAll('[data-prueba="aviso-titulo"]')].map((t) => t.textContent),
    ).toContain('ING-2026-00331 espera el destare');
  });

  it('se recarga al abrir la sesión, al abrir el panel, al navegar y al volver a la pestaña (RNF-M07-16)', async () => {
    const { fixture, raiz } = montar();
    expect(api.avisos).toHaveBeenCalledTimes(1);

    abrirPanel(raiz, fixture);
    expect(api.avisos).toHaveBeenCalledTimes(2);

    await TestBed.inject(Router).navigateByUrl('/otra');
    expect(api.avisos).toHaveBeenCalledTimes(3);

    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(api.avisos).toHaveBeenCalledTimes(4);
  });

  it('con la pestaña oculta no recarga', () => {
    const { fixture } = montar();
    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(api.avisos).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });

  it('un aviso desaparece tras resolverse: la siguiente lectura ya no lo trae (CA10)', async () => {
    const { fixture, raiz } = montar();
    expect(raiz.querySelector('.mat-badge-content')?.textContent?.trim()).toBe('1');
    api.avisos.and.returnValue(of({ cantidad: 0, avisos: [], mensaje: 'No hay nada pendiente' }));
    await TestBed.inject(Router).navigateByUrl('/otra');
    estabilizar(fixture);
    expect(raiz.querySelector('button')?.getAttribute('aria-label')).toBe('Avisos: nada pendiente');
  });

  it('al destruirse el armazón limpia los avisos del usuario', () => {
    const { fixture } = montar();
    const servicio = TestBed.inject(AvisosService);
    expect(servicio.avisos().length).toBe(1);
    fixture.destroy();
    expect(servicio.avisos()).toEqual([]);
  });
});

describe('BusquedaCabeceraComponent (HU-M07-02 CA16 y CA17)', () => {
  let api: jasmine.SpyObj<ConsultaCabeceraApiService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;
  let navegar: jasmine.Spy;

  function montar() {
    api = jasmine.createSpyObj<ConsultaCabeceraApiService>('ConsultaCabeceraApiService', ['buscar']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', [
      'exito',
      'error',
      'rechazo',
    ]);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ConsultaCabeceraApiService, useValue: api },
        { provide: NotificacionService, useValue: notificacion },
      ],
    });
    navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(BusquedaCabeceraComponent);
    estabilizar(fixture);
    const raiz = fixture.nativeElement as HTMLElement;
    const buscar = (texto: string): void => {
      const entrada = raiz.querySelector<HTMLInputElement>('[data-prueba="busqueda"]');
      if (entrada) {
        entrada.value = texto;
        entrada.dispatchEvent(new Event('input'));
      }
      raiz.querySelector('form')?.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    };
    return { fixture, raiz, buscar };
  }

  it('un código, o sus dígitos finales, abre el detalle del ingreso que dice el servidor', () => {
    const { buscar, raiz } = montar();
    api.buscar.and.returnValue(of({ tipo: 'INGRESO', id: 12, codigo: 'ING-2026-00012' }));
    buscar(' 00012 ');
    expect(api.buscar).toHaveBeenCalledOnceWith('00012');
    expect(navegar).toHaveBeenCalledWith(['/consulta/ingresos', 12]);
    expect(raiz.querySelector<HTMLInputElement>('[data-prueba="busqueda"]')?.value).toBe('');
  });

  it('cualquier otro texto lleva a la consulta con esa placa', () => {
    const { buscar } = montar();
    api.buscar.and.returnValue(of({ tipo: 'PLACA', placa: 'ABC' }));
    buscar('ABC');
    expect(navegar).toHaveBeenCalledWith(['/consulta'], { queryParams: { placa: 'ABC' } });
  });

  it('un texto vacío no consulta nada', () => {
    const { buscar } = montar();
    buscar('   ');
    expect(api.buscar).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('un rechazo del servidor se avisa con su mensaje y no navega', () => {
    const { buscar } = montar();
    api.buscar.and.returnValue(throwError(() => new ErrorApi(400, 'ERROR', 'Texto no válido')));
    buscar('??');
    expect(notificacion.rechazo).toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('en teléfono queda un acceso directo a la consulta', () => {
    const { raiz } = montar();
    expect(raiz.querySelector('.solo-movil')?.getAttribute('href')).toBe('/consulta');
  });
});
