import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SesionService } from '@core/sesion/sesion.service';
import { Rol } from '@models/rol.model';
import { estabilizar } from '../../testing/estabilizar';
import {
  crearDetalle,
  crearEvento,
  crearEventoCorreccion,
  crearRespuestaLogin,
} from '../../testing/fabricas';
import { ConsultaApiService } from './data-access/consulta-api.service';
import { DetalleIngresoPage } from './pages/detalle-ingreso/detalle-ingreso.page';
import { PestanaHistorialComponent } from './ui/pestana-historial/pestana-historial.component';

describe('Pestaña Historial del ingreso (HU-M09-02, HU-M07-02 CA12)', () => {
  afterEach(() => localStorage.clear());

  function montarPestana(rol: Rol): HTMLElement {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideNoopAnimations()] });
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin(rol));
    const fixture = TestBed.createComponent(PestanaHistorialComponent);
    fixture.componentRef.setInput('eventos', [crearEvento(), crearEventoCorreccion()]);
    fixture.componentRef.setInput('codigo', 'ING-2026-00331');
    estabilizar(fixture);
    return fixture.nativeElement as HTMLElement;
  }

  it('el Administrador ve el historial y el enlace a la auditoría, ya filtrada por el ingreso', () => {
    const raiz = montarPestana('ADMINISTRADOR');
    expect(raiz.querySelectorAll('[data-prueba="evento"]').length).toBe(2);
    expect(raiz.querySelector('[data-prueba="enlace-auditoria"]')?.getAttribute('href')).toBe(
      '/administracion/auditoria?texto=ING-2026-00331',
    );
  });

  it('el Supervisor ve el mismo historial, sin el enlace a la auditoría (HU-M09-02 CA04, CA05)', () => {
    const raiz = montarPestana('SUPERVISOR');
    expect(raiz.querySelectorAll('[data-prueba="evento"]').length).toBe(2);
    expect(raiz.querySelector('[data-prueba="enlace-auditoria"]')).toBeNull();
  });

  it('el Administrativo tampoco ve el enlace (CA05)', () => {
    const raiz = montarPestana('ADMINISTRATIVO');
    expect(raiz.querySelectorAll('[data-prueba="evento"]').length).toBe(2);
    expect(raiz.querySelector('[data-prueba="enlace-auditoria"]')).toBeNull();
  });

  describe('dentro del detalle', () => {
    let api: jasmine.SpyObj<ConsultaApiService>;

    beforeEach(() => {
      TestBed.resetTestingModule();
      api = jasmine.createSpyObj<ConsultaApiService>('ConsultaApiService', [
        'detalleIngreso',
        'ticketIngreso',
      ]);
      api.detalleIngreso.and.returnValue(
        of(crearDetalle({ historial: [crearEvento(), crearEventoCorreccion()] })),
      );
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          provideNoopAnimations(),
          { provide: ConsultaApiService, useValue: api },
        ],
      });
      TestBed.inject(SesionService).iniciar(crearRespuestaLogin('SUPERVISOR'));
    });

    function abrir(pestana: string) {
      const fixture = TestBed.createComponent(DetalleIngresoPage);
      fixture.componentRef.setInput('id', '331');
      fixture.componentRef.setInput('pestana', pestana);
      estabilizar(fixture);
      return fixture.nativeElement as HTMLElement;
    }

    it('es una pestaña más, en la URL, con los eventos que ya trae el detalle (sin otra llamada)', () => {
      const raiz = abrir('historial');
      expect(raiz.querySelector('[data-prueba="pestana-historial"]')?.textContent).toContain('Historial');
      expect(raiz.querySelector('app-pestana-historial')).not.toBeNull();
      expect(raiz.querySelectorAll('[data-prueba="evento"]').length).toBe(2);
      expect(api.detalleIngreso).toHaveBeenCalledOnceWith(331);
    });

    it('las demás pestañas no dibujan el historial', () => {
      expect(abrir('datos').querySelector('app-pestana-historial')).toBeNull();
    });
  });
});
