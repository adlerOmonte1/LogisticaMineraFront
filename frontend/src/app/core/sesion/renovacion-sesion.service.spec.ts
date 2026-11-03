import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { crearRespuestaLogin, crearToken } from '../../testing/fabricas';
import { ActividadUsuarioService } from './actividad-usuario.service';
import { RELOJ } from './reloj';
import { RenovacionSesionService } from './renovacion-sesion.service';
import { SesionApiService } from './sesion-api.service';
import { SesionService } from './sesion.service';

describe('RenovacionSesionService', () => {
  const ahora = 2_000_000_000_000;
  let api: jasmine.SpyObj<SesionApiService>;
  let sesion: SesionService;

  function configurar(vencimientoAccess: number, ultimaActividad = ahora): RenovacionSesionService {
    api = jasmine.createSpyObj<SesionApiService>('SesionApiService', ['renovar']);
    TestBed.configureTestingModule({
      providers: [
        { provide: SesionApiService, useValue: api },
        { provide: RELOJ, useValue: () => ahora },
        { provide: ActividadUsuarioService, useValue: { ultimaActividad } },
      ],
    });
    sesion = TestBed.inject(SesionService);
    sesion.iniciar({ ...crearRespuestaLogin(), access: crearToken(vencimientoAccess) });
    return TestBed.inject(RenovacionSesionService);
  }

  afterEach(() => localStorage.clear());

  it('no renueva si el access no está por vencer', () => {
    const servicio = configurar(ahora + 25 * 60_000);
    servicio.renovarSiCorresponde().subscribe();
    expect(api.renovar).not.toHaveBeenCalled();
  });

  it('renueva y guarda el access nuevo', () => {
    const servicio = configurar(ahora + 60_000);
    api.renovar.and.returnValue(of('access-nuevo'));

    servicio.renovarSiCorresponde().subscribe();

    expect(api.renovar).toHaveBeenCalledOnceWith('refresh-de-prueba');
    expect(sesion.access).toBe('access-nuevo');
  });

  it('varias peticiones simultáneas comparten una sola renovación', () => {
    const servicio = configurar(ahora + 60_000);
    const respuesta = new Subject<string>();
    api.renovar.and.returnValue(respuesta);

    let terminadas = 0;
    for (let i = 0; i < 5; i++) {
      servicio.renovarSiCorresponde().subscribe(() => terminadas++);
    }
    respuesta.next('access-nuevo');
    respuesta.complete();

    expect(api.renovar).toHaveBeenCalledTimes(1);
    expect(terminadas).toBe(5);
  });

  it('si la renovación falla, la petición sigue con el token actual', () => {
    const servicio = configurar(ahora + 60_000);
    const actual = sesion.access;
    api.renovar.and.returnValue(throwError(() => new Error('401')));

    let completo = false;
    servicio.renovarSiCorresponde().subscribe({ complete: () => (completo = true) });

    expect(completo).toBeTrue();
    expect(sesion.access).toBe(actual);
  });
});
