import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SesionService } from '@core/sesion/sesion.service';
import { TrazabilidadIngreso } from '@models/trazabilidad.model';
import { estabilizar } from '../../testing/estabilizar';
import { crearDetalle, crearRespuestaLogin, crearTrazabilidad } from '../../testing/fabricas';
import { ConsultaApiService } from './data-access/consulta-api.service';
import { DetalleIngresoPage } from './pages/detalle-ingreso/detalle-ingreso.page';
import { PestanaTrazabilidadComponent } from './ui/pestana-trazabilidad/pestana-trazabilidad.component';

function montar(trazabilidad: TrazabilidadIngreso): HTMLElement {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideRouter([]), provideNoopAnimations()] });
  const fixture = TestBed.createComponent(PestanaTrazabilidadComponent);
  fixture.componentRef.setInput('trazabilidad', trazabilidad);
  estabilizar(fixture);
  return fixture.nativeElement as HTMLElement;
}

const texto = (raiz: HTMLElement, prueba: string): string =>
  (raiz.querySelector(`[data-prueba="${prueba}"]`)?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('Pestaña Trazabilidad del ingreso (HU-M06-03, HU-M07-01 CA10 y CA11)', () => {
  it('muestra las etapas de la ruta, completadas o no, con fecha y responsable (CA01)', () => {
    const raiz = montar(crearTrazabilidad());
    const etapas = [...raiz.querySelectorAll('[data-prueba="etapa"]')];
    expect(etapas.length).toBe(3);
    expect(etapas.map((e) => e.getAttribute('data-completada'))).toEqual(['true', 'false', 'false']);
    expect(etapas[0].querySelector('[data-prueba="etapa-estado"]')?.textContent).toBe('Completada');
    expect(etapas[0].querySelector('[data-prueba="etapa-fecha"]')?.textContent?.trim()).toBe(
      '03/11/2026 09:00',
    );
    expect(etapas[0].querySelector('[data-prueba="etapa-usuario"]')?.textContent).toBe('sup.prueba');
    expect(etapas[1].querySelector('[data-prueba="etapa-estado"]')?.textContent).toBe('Pendiente');
  });

  it('dice «x de y etapas» (CA04)', () => {
    expect(texto(montar(crearTrazabilidad()), 'proporcion')).toBe('1 de 3 etapas');
  });

  it('con el proceso completo lo señala (CA03)', () => {
    const raiz = montar(crearTrazabilidad({ proceso_completo: true, etapas_recorridas: 3 }));
    expect(texto(raiz, 'avance')).toContain('Proceso completo');
    expect(texto(raiz, 'proporcion')).toBe('3 de 3 etapas');
  });

  it('sin lote muestra el mensaje del servidor y nada más (CA02, HU-M07-01 CA11)', () => {
    const raiz = montar(
      crearTrazabilidad({
        lote: null,
        secado: undefined,
        lineas: [],
        mensaje: 'El ingreso espera en cancha',
      }),
    );
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('El ingreso espera en cancha');
    expect(raiz.querySelector('[data-prueba="lote"]')).toBeNull();
    expect(raiz.querySelector('[data-prueba="etapa"]')).toBeNull();
  });

  it('un ingreso anulado lo señala (CA05)', () => {
    expect(texto(montar(crearTrazabilidad({ anulado: true })), 'anulado')).toContain('Ingreso anulado');
    expect(montar(crearTrazabilidad()).querySelector('[data-prueba="anulado"]')).toBeNull();
  });

  it('con la ruta por decidir no hay proporción: solo lo recorrido (CA07)', () => {
    const raiz = montar(
      crearTrazabilidad({
        ruta_por_decidir: true,
        etapas_totales: null,
        etapas_recorridas: 1,
        lineas: [
          {
            nombre: 'Lote prueba',
            ruta: null,
            etapas: [
              {
                codigo: 'SECADO',
                nombre: 'Secado',
                completada: true,
                fecha_hora: '2026-11-03T09:00:00-05:00',
                usuario: 'sup.prueba',
              },
            ],
          },
        ],
      }),
    );
    expect(raiz.querySelector('[data-prueba="proporcion"]')).toBeNull();
    expect(texto(raiz, 'ruta-por-decidir')).toBe('Ruta por decidir · 1 etapa recorrida');
  });

  it('un lote dividido muestra una línea por parte, cada una con su ruta (CA06)', () => {
    const raiz = montar(
      crearTrazabilidad({
        lineas: [
          {
            nombre: 'Parte A',
            ruta: 'ZARANDEO_ENSACADO',
            etapas: [
              { codigo: 'ZARANDEO', nombre: 'Zarandeo', completada: false, fecha_hora: null, usuario: null },
            ],
          },
          {
            nombre: 'Parte B',
            ruta: 'MOLIENDA_ENSACADO',
            etapas: [
              { codigo: 'MOLIENDA', nombre: 'Molienda', completada: false, fecha_hora: null, usuario: null },
            ],
          },
        ],
        secado: {
          propio: false,
          completado: true,
          fecha_hora: '2026-11-03T09:00:00-05:00',
          usuario: 'sup.prueba',
        },
      }),
    );
    expect([...raiz.querySelectorAll('[data-prueba="linea-nombre"]')].map((n) => n.textContent)).toEqual([
      'Parte A',
      'Parte B',
    ]);
    // El secado no está entre las etapas de las partes: se muestra aparte.
    expect(texto(raiz, 'secado')).toContain('03/11/2026 09:00');
  });

  it('el secado no se repite cuando ya figura entre las etapas', () => {
    expect(montar(crearTrazabilidad()).querySelector('[data-prueba="secado"]')).toBeNull();
  });

  it('un tardío con secado propio lo señala', () => {
    const raiz = montar(
      crearTrazabilidad({
        lineas: [],
        secado: { propio: true, completado: false, fecha_hora: null, usuario: null },
      }),
    );
    expect(texto(raiz, 'secado')).toContain('Secado propio');
    expect(texto(raiz, 'secado')).toContain('Pendiente');
  });

  it('un lote cerrado muestra su destino y la fecha del cierre (CA08)', () => {
    const base = crearTrazabilidad();
    const raiz = montar(
      crearTrazabilidad({
        proceso_completo: true,
        lote: {
          ...(base.lote ?? crearTrazabilidad().lote!),
          estado: 'CERRADO',
          destino: 'VENTA',
          fecha_cierre: '2026-11-05T09:00:00-05:00',
        },
      }),
    );
    expect(texto(raiz, 'destino')).toBe('Venta');
    expect(texto(raiz, 'cierre')).toBe('05/11/2026 09:00');
  });

  it('un lote en recorrido no muestra destino ni cierre', () => {
    const raiz = montar(crearTrazabilidad());
    expect(raiz.querySelector('[data-prueba="destino"]')).toBeNull();
  });

  it('el nombre del lote enlaza a su detalle', () => {
    const enlace = montar(crearTrazabilidad()).querySelector('[data-prueba="lote"] a');
    expect(enlace?.getAttribute('href')).toBe('/lotes/12');
  });

  describe('dentro del detalle', () => {
    afterEach(() => localStorage.clear());

    it('es una pestaña más, con los datos que ya trae el detalle, sin otra llamada', () => {
      TestBed.resetTestingModule();
      const api = jasmine.createSpyObj<ConsultaApiService>('ConsultaApiService', [
        'detalleIngreso',
        'ticketIngreso',
      ]);
      api.detalleIngreso.and.returnValue(of(crearDetalle({ trazabilidad: crearTrazabilidad() })));
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          provideNoopAnimations(),
          { provide: ConsultaApiService, useValue: api },
        ],
      });
      TestBed.inject(SesionService).iniciar(crearRespuestaLogin('SUPERVISOR'));
      const fixture = TestBed.createComponent(DetalleIngresoPage);
      fixture.componentRef.setInput('id', '331');
      fixture.componentRef.setInput('pestana', 'trazabilidad');
      estabilizar(fixture);
      const raiz = fixture.nativeElement as HTMLElement;

      expect(raiz.querySelector('[data-prueba="pestana-trazabilidad"]')?.textContent).toContain(
        'Trazabilidad',
      );
      expect(raiz.querySelector('app-pestana-trazabilidad')).not.toBeNull();
      expect(api.detalleIngreso).toHaveBeenCalledOnceWith(331);
    });
  });
});
