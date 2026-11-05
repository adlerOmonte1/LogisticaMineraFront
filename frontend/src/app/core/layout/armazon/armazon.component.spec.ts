import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Rol } from '@models/rol.model';
import { crearRespuestaLogin } from '../../../testing/fabricas';
import { ConsultaCabeceraApiService } from '../../consulta/consulta-cabecera-api.service';
import { AutenticacionService } from '../../sesion/autenticacion.service';
import { SesionService } from '../../sesion/sesion.service';
import { ArmazonComponent } from './armazon.component';

describe('ArmazonComponent', () => {
  let autenticacion: jasmine.SpyObj<AutenticacionService>;
  let cabecera: jasmine.SpyObj<ConsultaCabeceraApiService>;

  function montar(rol: Rol, debeCambiarClave = false) {
    autenticacion = jasmine.createSpyObj<AutenticacionService>('AutenticacionService', ['cerrarSesion']);
    autenticacion.cerrarSesion.and.returnValue(of(undefined));
    cabecera = jasmine.createSpyObj<ConsultaCabeceraApiService>('ConsultaCabeceraApiService', [
      'avisos',
      'buscar',
    ]);
    cabecera.avisos.and.returnValue(of({ cantidad: 0, avisos: [], mensaje: 'No hay nada pendiente' }));
    TestBed.configureTestingModule({
      imports: [ArmazonComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AutenticacionService, useValue: autenticacion },
        { provide: ConsultaCabeceraApiService, useValue: cabecera },
      ],
    });
    TestBed.inject(SesionService).iniciar(crearRespuestaLogin(rol, { debe_cambiar_clave: debeCambiarClave }));
    const fixture = TestBed.createComponent(ArmazonComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => localStorage.clear());

  function enlacesDelMenu(elemento: HTMLElement): string[] {
    return [...elemento.querySelectorAll('.menu__enlace span')].map((span) => span.textContent?.trim() ?? '');
  }

  it('construye el menú con el rol de la sesión', () => {
    const fixture = montar('SUPERVISOR');
    expect(enlacesDelMenu(fixture.nativeElement)).toEqual([
      'Inicio',
      'Ingresos',
      'Destares',
      'Calendario',
      'Trazabilidad',
      'Consulta',
    ]);
  });

  it('oculta el menú mientras la contraseña temporal esté pendiente', () => {
    const fixture = montar('ADMINISTRADOR', true);
    expect(fixture.nativeElement.querySelector('app-menu-lateral')).toBeNull();
  });

  it('la cabecera trae la búsqueda y la campana de avisos (HU-M07-02 CA16, HU-M07-04 CA06)', () => {
    const fixture = montar('SUPERVISOR');
    expect(fixture.nativeElement.querySelector('app-busqueda-cabecera')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-campana-avisos')).not.toBeNull();
    expect(cabecera.avisos).toHaveBeenCalled();
  });

  it('con la contraseña temporal pendiente no hay búsqueda ni avisos, y no se piden', () => {
    const fixture = montar('ADMINISTRADOR', true);
    expect(fixture.nativeElement.querySelector('app-busqueda-cabecera')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-campana-avisos')).toBeNull();
    expect(cabecera.avisos).not.toHaveBeenCalled();
  });

  it('cierra la sesión desde el menú del usuario', () => {
    const fixture = montar('ADMINISTRADOR');
    fixture.componentInstance.cerrarSesion();
    expect(autenticacion.cerrarSesion).toHaveBeenCalled();
  });
});
