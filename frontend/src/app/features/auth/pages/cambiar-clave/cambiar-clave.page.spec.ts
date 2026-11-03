import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AutenticacionService } from '@core/sesion/autenticacion.service';
import { ErrorApi } from '@models/error-api.model';
import { CuentaApiService } from '../../data-access/cuenta-api.service';
import { CambiarClavePage } from './cambiar-clave.page';

describe('CambiarClavePage', () => {
  let cuenta: jasmine.SpyObj<CuentaApiService>;
  let autenticacion: jasmine.SpyObj<AutenticacionService>;

  beforeEach(() => {
    cuenta = jasmine.createSpyObj<CuentaApiService>('CuentaApiService', ['cambiarClave']);
    autenticacion = jasmine.createSpyObj<AutenticacionService>('AutenticacionService', ['cerrarSesion']);
    autenticacion.cerrarSesion.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [CambiarClavePage],
      providers: [
        provideNoopAnimations(),
        { provide: CuentaApiService, useValue: cuenta },
        { provide: AutenticacionService, useValue: autenticacion },
      ],
    });
  });

  function montarConValores() {
    const fixture = TestBed.createComponent(CambiarClavePage);
    fixture.detectChanges();
    const pagina = fixture.componentInstance as unknown as { formulario: { setValue(v: object): void } };
    pagina.formulario.setValue({
      password_actual: 'a',
      password_nueva: 'b',
      password_nueva_confirmacion: 'c',
    });
    return fixture;
  }

  it('tras cambiarla, cierra la sesión con el mensaje del servidor (HU-M01-02 CA05)', () => {
    cuenta.cambiarClave.and.returnValue(of({ mensaje: 'Contraseña cambiada. Inicie sesión nuevamente' }));
    const fixture = montarConValores();
    fixture.componentInstance.cambiar();
    expect(autenticacion.cerrarSesion).toHaveBeenCalledWith('Contraseña cambiada. Inicie sesión nuevamente');
  });

  it('muestra el rechazo literal: el cliente no adelanta la regla (CA11)', () => {
    cuenta.cambiarClave.and.returnValue(
      throwError(() => new ErrorApi(400, 'PASSWORDS_NO_COINCIDEN', 'Las contraseñas no coinciden')),
    );
    const fixture = montarConValores();
    fixture.componentInstance.cambiar();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Las contraseñas no coinciden');
    expect(autenticacion.cerrarSesion).not.toHaveBeenCalled();
  });

  it('no envía si falta un campo', () => {
    const fixture = TestBed.createComponent(CambiarClavePage);
    fixture.detectChanges();
    fixture.componentInstance.cambiar();
    expect(cuenta.cambiarClave).not.toHaveBeenCalled();
  });
});
