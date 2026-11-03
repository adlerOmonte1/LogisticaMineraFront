import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { crearRespuestaLogin, crearUsuarioSesion } from '../../testing/fabricas';
import {
  AutenticacionService,
  RUTA_CAMBIO_CLAVE,
  RUTA_INICIO_SESION,
  RUTA_PRINCIPAL,
} from './autenticacion.service';
import { SesionApiService } from './sesion-api.service';
import { SesionService } from './sesion.service';

describe('AutenticacionService', () => {
  let api: jasmine.SpyObj<SesionApiService>;
  let router: jasmine.SpyObj<Router>;
  let servicio: AutenticacionService;
  let sesion: SesionService;

  beforeEach(() => {
    api = jasmine.createSpyObj<SesionApiService>('SesionApiService', ['iniciar', 'cerrar', 'renovar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    TestBed.configureTestingModule({
      providers: [
        { provide: SesionApiService, useValue: api },
        { provide: Router, useValue: router },
      ],
    });
    servicio = TestBed.inject(AutenticacionService);
    sesion = TestBed.inject(SesionService);
  });

  afterEach(() => localStorage.clear());

  it('inicia la sesión y devuelve el usuario', () => {
    api.iniciar.and.returnValue(of(crearRespuestaLogin('SUPERVISOR')));
    let rol: string | undefined;

    servicio.iniciarSesion({ username: 'u', password: 'p' }).subscribe((usuario) => (rol = usuario.rol));

    expect(rol).toBe('SUPERVISOR');
    expect(sesion.autenticado()).toBeTrue();
  });

  it('lleva al cambio de contraseña si la tiene temporal (HU-M01-01 CA09)', () => {
    expect(servicio.rutaDeEntrada(crearUsuarioSesion({ debe_cambiar_clave: true }))).toBe(RUTA_CAMBIO_CLAVE);
    expect(servicio.rutaDeEntrada(crearUsuarioSesion())).toBe(RUTA_PRINCIPAL);
  });

  it('cierra la sesión invalidando el refresh (HU-M01-01 CA05)', () => {
    sesion.iniciar(crearRespuestaLogin());
    api.cerrar.and.returnValue(of(undefined));

    servicio.cerrarSesion().subscribe();

    expect(api.cerrar).toHaveBeenCalledWith('refresh-de-prueba');
    expect(sesion.autenticado()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_INICIO_SESION);
  });

  it('cierra igual si la API falla, y guarda el motivo para el login', () => {
    sesion.iniciar(crearRespuestaLogin());
    api.cerrar.and.returnValue(throwError(() => new Error('sin red')));

    servicio.cerrarSesion('Contraseña cambiada. Inicie sesión nuevamente').subscribe();

    expect(sesion.autenticado()).toBeFalse();
    expect(servicio.motivoCierre()).toBe('Contraseña cambiada. Inicie sesión nuevamente');
  });

  it('expira la sesión con el mensaje del servidor sin llamar a la API', () => {
    sesion.iniciar(crearRespuestaLogin());
    servicio.expirarSesion('Su sesión ha expirado. Ingrese nuevamente');

    expect(api.cerrar).not.toHaveBeenCalled();
    expect(servicio.motivoCierre()).toBe('Su sesión ha expirado. Ingrese nuevamente');
    servicio.descartarMotivo();
    expect(servicio.motivoCierre()).toBeNull();
  });
});
