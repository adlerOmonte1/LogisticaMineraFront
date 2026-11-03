import { TestBed } from '@angular/core/testing';

import { DEFINICION_PERMISOS } from '@core/autorizacion/permisos';
import { PermisosPage } from './permisos.page';

describe('PermisosPage', () => {
  it('dibuja una fila por operación y una columna por rol', () => {
    const fixture = TestBed.createComponent(PermisosPage);
    fixture.detectChanges();
    const elemento: HTMLElement = fixture.nativeElement;
    expect(elemento.querySelectorAll('tr.mat-mdc-row').length).toBe(DEFINICION_PERMISOS.length);
    expect(elemento.querySelectorAll('th').length).toBe(4);
    expect(elemento.querySelectorAll('[aria-label="Permitido"]').length).toBe(
      DEFINICION_PERMISOS.reduce((total, d) => total + d.roles.length, 0),
    );
  });
});
