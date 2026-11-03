import { TestBed } from '@angular/core/testing';

import { crearRespuestaLogin } from '../../testing/fabricas';
import { SesionService } from './sesion.service';

describe('SesionService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('inicia sin sesión', () => {
    const sesion = TestBed.inject(SesionService);
    expect(sesion.autenticado()).toBeFalse();
    expect(sesion.rol()).toBeNull();
    expect(sesion.access).toBeNull();
    expect(sesion.vencimientoAccess).toBeNull();
  });

  it('guarda la sesión y la restaura al recargar', () => {
    const respuesta = crearRespuestaLogin('SUPERVISOR');
    TestBed.inject(SesionService).iniciar(respuesta);

    TestBed.resetTestingModule();
    const restaurada = TestBed.inject(SesionService);

    expect(restaurada.autenticado()).toBeTrue();
    expect(restaurada.rol()).toBe('SUPERVISOR');
    expect(restaurada.refresh).toBe(respuesta.refresh);
    expect(restaurada.vencimientoAccess).toBeGreaterThan(Date.now());
  });

  it('actualiza el access sin tocar al usuario', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar(crearRespuestaLogin());
    sesion.actualizarAccess('nuevo');
    expect(sesion.access).toBe('nuevo');
    expect(sesion.usuario()?.username).toBe('admin.prueba');
  });

  it('marca la contraseña temporal pendiente', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar(crearRespuestaLogin());
    sesion.marcarClaveTemporalPendiente();
    expect(sesion.debeCambiarClave()).toBeTrue();
  });

  it('finaliza y borra lo guardado', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar(crearRespuestaLogin());
    sesion.finalizar();
    expect(sesion.autenticado()).toBeFalse();
    expect(localStorage.length).toBe(0);
  });

  it('sin sesión, actualizar o marcar no hace nada', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.actualizarAccess('x');
    sesion.marcarClaveTemporalPendiente();
    expect(sesion.autenticado()).toBeFalse();
  });
});
