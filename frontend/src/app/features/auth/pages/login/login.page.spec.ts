import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { AutenticacionService } from '@core/sesion/autenticacion.service';
import { ErrorApi } from '@models/error-api.model';
import { crearUsuarioSesion } from '../../../../testing/fabricas';
import { DialogoOlvidoClaveComponent } from '../../ui/dialogo-olvido-clave.component';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let autenticacion: jasmine.SpyObj<AutenticacionService>;
  let dialogos: jasmine.SpyObj<DialogosService>;
  const motivo = signal<string | null>(null);

  beforeEach(() => {
    autenticacion = jasmine.createSpyObj<AutenticacionService>(
      'AutenticacionService',
      ['iniciarSesion', 'rutaDeEntrada', 'descartarMotivo'],
      { motivoCierre: motivo },
    );
    dialogos = jasmine.createSpyObj<DialogosService>('DialogosService', ['abrir']);
    dialogos.abrir.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AutenticacionService, useValue: autenticacion },
        { provide: DialogosService, useValue: dialogos },
      ],
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture;
  }

  function escribir(elemento: HTMLElement, prueba: string, valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>(`[data-prueba="${prueba}"]`);
    if (input) {
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    }
  }

  it('no envía un formulario incompleto', () => {
    const fixture = montar();
    fixture.componentInstance.ingresar();
    expect(autenticacion.iniciarSesion).not.toHaveBeenCalled();
  });

  it('con credenciales válidas, va a la pantalla de entrada del rol (HU-M01-01 CA01)', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    autenticacion.iniciarSesion.and.returnValue(of(crearUsuarioSesion()));
    autenticacion.rutaDeEntrada.and.returnValue('/inicio');
    const fixture = montar();

    escribir(fixture.nativeElement, 'usuario', 'admin.prueba');
    escribir(fixture.nativeElement, 'clave', 'secreta');
    fixture.componentInstance.ingresar();

    expect(autenticacion.iniciarSesion).toHaveBeenCalledWith({
      username: 'admin.prueba',
      password: 'secreta',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/inicio');
  });

  it('muestra el rechazo literal del servidor sin marcar un campo (HU-M01-01 CA02)', () => {
    autenticacion.iniciarSesion.and.returnValue(
      throwError(() => new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos')),
    );
    const fixture = montar();
    escribir(fixture.nativeElement, 'usuario', 'x');
    escribir(fixture.nativeElement, 'clave', 'y');
    fixture.componentInstance.ingresar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Usuario o contraseña incorrectos',
    );
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent?.trim() ?? '').toBe('');
  });

  it('muestra por qué terminó la sesión anterior', () => {
    motivo.set('Su sesión ha expirado. Ingrese nuevamente');
    const fixture = montar();
    expect(fixture.nativeElement.textContent).toContain('Su sesión ha expirado. Ingrese nuevamente');
    motivo.set(null);
  });

  it('«¿Olvidó su contraseña?» abre la ayuda sin consultar al servidor (HU-M01-01 CA08)', () => {
    const fixture = montar();
    fixture.componentInstance.mostrarAyudaClave();
    expect(dialogos.abrir).toHaveBeenCalledWith(DialogoOlvidoClaveComponent, null);
    expect(autenticacion.iniciarSesion).not.toHaveBeenCalled();
  });

  it('alterna la visibilidad de la contraseña', () => {
    const fixture = montar();
    fixture.componentInstance.alternarClave();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-prueba="clave"]').type).toBe('text');
  });
});
