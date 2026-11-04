import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { crearRespuestaLogin } from '../../testing/fabricas';
import { SesionService } from '../sesion/sesion.service';
import { SiPuedeDirective } from './si-puede.directive';

@Component({
  standalone: true,
  imports: [SiPuedeDirective, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button *appSiPuede="'MODIFICAR_TARA'"><mat-icon>scale</mat-icon>Modificar tara</button>`,
})
class AnfitrionComponent {}

describe('SiPuedeDirective', () => {
  afterEach(() => localStorage.clear());

  it('muestra el contenido solo al rol con el permiso y reacciona al cambio de sesión', () => {
    const sesion = TestBed.inject(SesionService);
    sesion.iniciar(crearRespuestaLogin('ADMINISTRATIVO'));
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    sesion.iniciar(crearRespuestaLogin('ADMINISTRADOR'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();

    // El contenido nace en un effect: sus componentes hijos deben inicializarse igual.
    expect(fixture.nativeElement.querySelector('mat-icon').classList).toContain('material-icons');

    sesion.finalizar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
