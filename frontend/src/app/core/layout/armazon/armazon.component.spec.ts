import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Rol } from '@models/rol.model';
import { crearRespuestaLogin } from '../../../testing/fabricas';
import { AutenticacionService } from '../../sesion/autenticacion.service';
import { SesionService } from '../../sesion/sesion.service';
import { ArmazonComponent } from './armazon.component';

describe('ArmazonComponent', () => {
  let autenticacion: jasmine.SpyObj<AutenticacionService>;

  function montar(rol: Rol, debeCambiarClave = false) {
    autenticacion = jasmine.createSpyObj<AutenticacionService>('AutenticacionService', ['cerrarSesion']);
    autenticacion.cerrarSesion.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [ArmazonComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AutenticacionService, useValue: autenticacion },
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

  it('cierra la sesión desde el menú del usuario', () => {
    const fixture = montar('ADMINISTRADOR');
    fixture.componentInstance.cerrarSesion();
    expect(autenticacion.cerrarSesion).toHaveBeenCalled();
  });
});
