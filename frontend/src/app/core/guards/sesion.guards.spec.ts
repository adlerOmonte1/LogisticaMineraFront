import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { Rol } from '@models/rol.model';
import { crearRespuestaLogin } from '../../testing/fabricas';
import { SesionService } from '../sesion/sesion.service';
import { claveTemporalGuard, invitadoGuard, permisoGuard, sesionGuard } from './sesion.guards';

describe('Guards de sesión', () => {
  let sesion: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    sesion = TestBed.inject(SesionService);
  });

  afterEach(() => localStorage.clear());

  function ejecutar(guard: CanActivateFn): boolean | string {
    const resultado = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
    return resultado instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resultado) : resultado;
  }

  function entrarComo(rol: Rol, debeCambiarClave = false): void {
    sesion.iniciar(crearRespuestaLogin(rol, { debe_cambiar_clave: debeCambiarClave }));
  }

  it('sin sesión, lleva al inicio de sesión', () => {
    expect(ejecutar(sesionGuard)).toBe('/login');
    entrarComo('SUPERVISOR');
    expect(ejecutar(sesionGuard)).toBeTrue();
  });

  it('con sesión, el inicio de sesión lleva a la pantalla de entrada', () => {
    expect(ejecutar(invitadoGuard)).toBeTrue();
    entrarComo('SUPERVISOR');
    expect(ejecutar(invitadoGuard)).toBe('/inicio');
  });

  it('con la contraseña temporal pendiente, solo se puede cambiarla', () => {
    entrarComo('SUPERVISOR', true);
    expect(ejecutar(invitadoGuard)).toBe('/cuenta/clave');
    expect(ejecutar(claveTemporalGuard)).toBe('/cuenta/clave');
    entrarComo('SUPERVISOR');
    expect(ejecutar(claveTemporalGuard)).toBeTrue();
  });

  it('una ruta fuera del rol lleva a «Acción no autorizada» (HU-M01-03 CA02)', () => {
    entrarComo('SUPERVISOR');
    expect(ejecutar(permisoGuard('GESTIONAR_CATALOGO'))).toBe('/acceso-denegado');
    entrarComo('ADMINISTRATIVO');
    expect(ejecutar(permisoGuard('GESTIONAR_CATALOGO'))).toBeTrue();
  });
});
