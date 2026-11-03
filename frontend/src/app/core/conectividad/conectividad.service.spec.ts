import { TestBed } from '@angular/core/testing';

import { ConectividadService } from './conectividad.service';

describe('ConectividadService', () => {
  it('sigue los eventos online y offline del navegador', () => {
    const servicio = TestBed.inject(ConectividadService);
    window.dispatchEvent(new Event('offline'));
    expect(servicio.enLinea()).toBeFalse();
    window.dispatchEvent(new Event('online'));
    expect(servicio.enLinea()).toBeTrue();
  });
});
