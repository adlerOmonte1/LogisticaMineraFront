import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { API_URL } from '@core/http/api-url.token';
import { ArchivoDescargado, DescargaService } from '@core/http/descarga.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { Periodo } from '@models/consolidacion.model';
import { ErrorApi } from '@models/error-api.model';
import {
  SelectorPeriodoComponent,
  compararPeriodos,
  periodoAnterior,
  periodoSiguiente,
} from '@shared/components/selector-periodo/selector-periodo.component';
import { estabilizar } from '../../testing/estabilizar';
import { crearConsolidado } from '../../testing/fabricas';
import { CONSOLIDACION_ROUTES } from './consolidacion.routes';
import { ConsolidacionApiService } from './data-access/consolidacion-api.service';
import { ConsolidacionPage, leerPeriodo, mesEnCurso } from './pages/consolidacion/consolidacion.page';
import { TablaConsolidadoComponent } from './ui/tabla-consolidado/tabla-consolidado.component';

function montar<T>(componente: Type<T>, proveedores: unknown[] = [], entradas: Record<string, unknown> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideNoopAnimations(), ...(proveedores as never[])],
  });
  const fixture = TestBed.createComponent(componente);
  for (const [nombre, valor] of Object.entries(entradas)) {
    fixture.componentRef.setInput(nombre, valor);
  }
  estabilizar(fixture);
  return { fixture, raiz: fixture.nativeElement as HTMLElement };
}

const texto = (raiz: HTMLElement, prueba: string): string =>
  (raiz.querySelector(`[data-prueba="${prueba}"]`)?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('ConsolidacionApiService (docs/contrato-api.md §7)', () => {
  it('pide el total del mes y exporta el mismo periodo como Blob con el nombre del servidor', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }],
    });
    const api = TestBed.inject(ConsolidacionApiService);
    const controlador = TestBed.inject(HttpTestingController);

    api.mensual({ anio: 2026, mes: 11 }).subscribe();
    controlador
      .expectOne(
        (p) => p.method === 'GET' && p.urlWithParams === '/api/v1/consolidacion/mensual/?anio=2026&mes=11',
      )
      .flush(crearConsolidado());

    let archivo: ArchivoDescargado | undefined;
    api.exportar({ anio: 2026, mes: 10 }).subscribe((a) => (archivo = a));
    const exportar = controlador.expectOne(
      (p) => p.urlWithParams === '/api/v1/consolidacion/mensual/exportar/?anio=2026&mes=10',
    );
    expect(exportar.request.responseType).toBe('blob');
    exportar.flush(new Blob(['xlsx']), {
      headers: { 'Content-Disposition': 'attachment; filename="consolidado_2026_10.xlsx"' },
    });
    expect(archivo?.nombre).toBe('consolidado_2026_10.xlsx');
    controlador.verify();
  });
});

describe('periodos', () => {
  it('el anterior y el siguiente cruzan el año', () => {
    expect(periodoAnterior({ anio: 2026, mes: 1 })).toEqual({ anio: 2025, mes: 12 });
    expect(periodoSiguiente({ anio: 2026, mes: 12 })).toEqual({ anio: 2027, mes: 1 });
    expect(periodoSiguiente({ anio: 2026, mes: 5 })).toEqual({ anio: 2026, mes: 6 });
  });

  it('compara por año y luego por mes', () => {
    expect(compararPeriodos({ anio: 2026, mes: 11 }, { anio: 2027, mes: 1 })).toBeLessThan(0);
    expect(compararPeriodos({ anio: 2026, mes: 11 }, { anio: 2026, mes: 11 })).toBe(0);
    expect(compararPeriodos({ anio: 2026, mes: 12 }, { anio: 2026, mes: 11 })).toBeGreaterThan(0);
  });

  it('el mes en curso es el de Lima, no el del equipo', () => {
    // 1 de diciembre a las 03:00 UTC es todavía 30 de noviembre en Lima.
    expect(mesEnCurso(new Date('2026-12-01T03:00:00Z'))).toEqual({ anio: 2026, mes: 11 });
  });

  it('lee el periodo de la URL y, si no es válido, usa el mes en curso', () => {
    const hoy: Periodo = { anio: 2026, mes: 11 };
    expect(leerPeriodo('2026', '10', hoy)).toEqual({ anio: 2026, mes: 10 });
    expect(leerPeriodo(undefined, undefined, hoy)).toEqual(hoy);
    expect(leerPeriodo('2026', '13', hoy)).toEqual(hoy);
    expect(leerPeriodo('abc', '5', hoy)).toEqual(hoy);
  });
});

describe('SelectorPeriodoComponent (HU-M08-01 CA04)', () => {
  const limite: Periodo = { anio: 2026, mes: 11 };

  function selector(periodo: Periodo, conLimite = true) {
    const r = montar(SelectorPeriodoComponent, [], { periodo, limite: conLimite ? limite : null });
    const emitidos: Periodo[] = [];
    r.fixture.componentInstance.cambio.subscribe((p) => emitidos.push(p));
    return { ...r, emitidos };
  }

  it('en el mes del límite no deja avanzar al mes siguiente', () => {
    const { raiz } = selector(limite);
    expect(raiz.querySelector<HTMLButtonElement>('[data-prueba="periodo-siguiente"]')?.disabled).toBeTrue();
  });

  it('antes del límite deja avanzar y retroceder', () => {
    const { raiz, emitidos } = selector({ anio: 2026, mes: 9 });
    raiz.querySelector<HTMLButtonElement>('[data-prueba="periodo-siguiente"]')?.click();
    raiz.querySelector<HTMLButtonElement>('[data-prueba="periodo-anterior"]')?.click();
    expect(emitidos).toEqual([
      { anio: 2026, mes: 10 },
      { anio: 2026, mes: 8 },
    ]);
  });

  it('en el año del límite la lista no ofrece meses futuros; en un año anterior, los doce', () => {
    const actual = selector(limite).fixture.componentInstance;
    expect(actual['meses']().map((m) => m.mes)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const anterior = selector({ anio: 2025, mes: 3 }).fixture.componentInstance;
    expect(anterior['meses']().length).toBe(12);
  });

  it('la lista de años termina en el del límite', () => {
    const { fixture } = selector(limite);
    const anios = fixture.componentInstance['anios']();
    expect(anios[0]).toBe(2026);
    expect(anios).not.toContain(2027);
  });

  it('al pasar al año del límite el mes se recorta para no quedar en el futuro', () => {
    const { fixture, emitidos } = selector({ anio: 2025, mes: 12 });
    fixture.componentInstance['elegirAnio'](2026);
    expect(emitidos).toEqual([{ anio: 2026, mes: 11 }]);
  });

  it('sin límite, cualquier mes', () => {
    const { raiz } = selector({ anio: 2030, mes: 12 }, false);
    expect(raiz.querySelector<HTMLButtonElement>('[data-prueba="periodo-siguiente"]')?.disabled).toBeFalse();
  });
});

describe('TablaConsolidadoComponent (HU-M08-01 CA01)', () => {
  it('una fila por tipo de mineral con ingresos, toneladas y participación, y la fila de total del servidor', () => {
    const { raiz } = montar(TablaConsolidadoComponent, [], { consolidado: crearConsolidado() });
    const filas = [...raiz.querySelectorAll('[data-prueba="fila-mineral"]')].map((f) =>
      [...f.querySelectorAll('td')].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim()).join(' '),
    );
    expect(filas).toEqual([
      'MOA Mineral óxido Pingüino 3 49.20 t 58.02 %',
      'MOB Mineral óxido tipo B 2 35.60 t 41.98 %',
    ]);
    expect(texto(raiz, 'total-ingresos')).toBe('5');
    expect(texto(raiz, 'total-toneladas')).toBe('84.80 t');
  });
});

describe('ConsolidacionPage (HU-M08-01 y 02)', () => {
  let api: jasmine.SpyObj<ConsolidacionApiService>;
  let descarga: jasmine.SpyObj<DescargaService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  function pagina(entradas: Record<string, unknown> = {}) {
    api = jasmine.createSpyObj<ConsolidacionApiService>('ConsolidacionApiService', ['mensual', 'exportar']);
    api.mensual.and.returnValue(of(crearConsolidado()));
    descarga = jasmine.createSpyObj<DescargaService>('DescargaService', ['guardar']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', [
      'exito',
      'error',
      'rechazo',
    ]);
    return montar(
      ConsolidacionPage,
      [
        { provide: ConsolidacionApiService, useValue: api },
        { provide: DescargaService, useValue: descarga },
        { provide: NotificacionService, useValue: notificacion },
      ],
      entradas,
    );
  }

  it('sin periodo en la URL consolida el mes en curso (T05)', () => {
    pagina();
    expect(api.mensual).toHaveBeenCalledOnceWith(mesEnCurso());
  });

  it('el periodo de la URL es el que se consolida', () => {
    pagina({ anio: '2026', mes: '10' });
    expect(api.mensual).toHaveBeenCalledOnceWith({ anio: 2026, mes: 10 });
  });

  it('muestra la tabla, «al corte de hoy», los En proceso con sus códigos y los anulados excluidos (CA01, CA02, CA07, CA09)', () => {
    const { raiz } = pagina();
    expect(raiz.querySelectorAll('[data-prueba="fila-mineral"]').length).toBe(2);
    expect(texto(raiz, 'al-corte')).toContain('Total al corte de hoy, 04/11/2026');
    expect(texto(raiz, 'en-proceso')).toContain('pendientes del destare');
    expect(texto(raiz, 'en-proceso-codigos')).toBe('ING-2026-00005');
    expect(texto(raiz, 'anulados')).toContain('1 ingreso anulado excluido del total');
  });

  it('un mes pasado no dice «al corte» ni avisa En proceso si el servidor no lo hace', () => {
    const { fixture, raiz } = pagina({ anio: '2026', mes: '9' });
    api.mensual.and.returnValue(
      of(
        crearConsolidado({
          mes: 8,
          al_corte: null,
          en_proceso_mensaje: null,
          en_proceso: { cantidad: 0, codigos: [] },
          anulados_excluidos: 0,
        }),
      ),
    );
    fixture.componentRef.setInput('mes', '8');
    estabilizar(fixture);
    expect(raiz.querySelector('[data-prueba="al-corte"]')).toBeNull();
    expect(raiz.querySelector('[data-prueba="en-proceso"]')).toBeNull();
    expect(texto(raiz, 'anulados')).toContain('Ningún ingreso anulado');
  });

  it('un mes sin ingresos muestra el mensaje del servidor en lugar de la tabla (CA03)', () => {
    const { fixture, raiz } = pagina();
    api.mensual.and.returnValue(
      of(
        crearConsolidado({
          tipos_mineral: [],
          total_toneladas: '0.00',
          total_ingresos: 0,
          mensaje: 'No hay ingresos registrados para el periodo indicado',
        }),
      ),
    );
    fixture.componentRef.setInput('anio', '2026');
    fixture.componentRef.setInput('mes', '5');
    estabilizar(fixture);
    expect(raiz.querySelector('app-estado-vacio')?.textContent).toContain(
      'No hay ingresos registrados para el periodo indicado',
    );
    expect(raiz.querySelector('[data-prueba="fila-mineral"]')).toBeNull();
  });

  it('un periodo futuro forzado por la URL muestra el rechazo literal del servidor (CA04)', () => {
    const { fixture, raiz } = pagina();
    api.mensual.and.returnValue(
      throwError(() => new ErrorApi(400, 'PERIODO_FUTURO', 'No se puede consolidar un periodo futuro')),
    );
    fixture.componentRef.setInput('anio', '2030');
    fixture.componentRef.setInput('mes', '1');
    estabilizar(fixture);
    expect(raiz.querySelector('[role=alert]')?.textContent).toContain(
      'No se puede consolidar un periodo futuro',
    );
  });

  it('elegir otro periodo lo lleva a la URL, para poder enlazarlo', () => {
    const { fixture } = pagina();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.componentInstance['cambiarPeriodo']({ anio: 2026, mes: 10 });
    expect(navegar).toHaveBeenCalledWith([], { queryParams: { anio: 2026, mes: 10 }, replaceUrl: true });
  });

  it('exporta el periodo elegido y entrega el XLSX con el nombre del servidor (HU-M08-02 CA01)', () => {
    const { raiz } = pagina({ anio: '2026', mes: '10' });
    const archivo = { nombre: 'consolidado_2026_10.xlsx', contenido: new Blob(['x']) };
    api.exportar.and.returnValue(of(archivo));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="exportar"]')?.click();
    expect(api.exportar).toHaveBeenCalledOnceWith({ anio: 2026, mes: 10 });
    expect(descarga.guardar).toHaveBeenCalledOnceWith(archivo);
  });

  it('exportar un mes vacío avisa con el mensaje del servidor, leído del Blob (HU-M08-02 CA02)', () => {
    const { raiz } = pagina();
    const rechazo = new ErrorApi(400, 'SIN_INGRESOS', 'No hay ingresos registrados para el periodo indicado');
    api.exportar.and.returnValue(throwError(() => rechazo));
    raiz.querySelector<HTMLButtonElement>('[data-prueba="exportar"]')?.click();
    expect(notificacion.rechazo).toHaveBeenCalledOnceWith(rechazo);
    expect(descarga.guardar).not.toHaveBeenCalled();
  });
});

describe('rutas de consolidación', () => {
  it('la raíz carga la página', async () => {
    expect(await CONSOLIDACION_ROUTES[0].loadComponent?.()).toBe(ConsolidacionPage);
  });
});
