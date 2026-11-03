import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ErrorApi } from '@models/error-api.model';
import { UsuarioDetalle } from '@models/usuario.model';
import { FormularioUsuarioComponent, ValorFormularioUsuario } from './formulario-usuario.component';

describe('FormularioUsuarioComponent', () => {
  const existente: UsuarioDetalle = {
    id: 3,
    username: 'jcondor',
    nombres: 'Juan',
    apellidos: 'Cóndor',
    rol: 'SUPERVISOR',
    is_active: true,
    date_joined: '2026-10-01T00:00:00-05:00',
  };

  function montar(usuario: UsuarioDetalle | null) {
    TestBed.configureTestingModule({
      imports: [FormularioUsuarioComponent],
      providers: [provideNoopAnimations()],
    });
    const fixture = TestBed.createComponent(FormularioUsuarioComponent);
    fixture.componentRef.setInput('usuario', usuario);
    fixture.detectChanges();
    const emitidos: ValorFormularioUsuario[] = [];
    fixture.componentInstance.enviar.subscribe((valor) => emitidos.push(valor));
    const formulario = (
      fixture.componentInstance as unknown as { formulario: { patchValue(v: object): void } }
    ).formulario;
    return { fixture, emitidos, formulario };
  }

  function enviar(fixture: ReturnType<typeof montar>['fixture']): void {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  }

  it('en el alta exige la contraseña y la emite (HU-M01-02 CA01)', () => {
    const { fixture, emitidos, formulario } = montar(null);
    formulario.patchValue({ username: 'nuevo', nombres: 'N', apellidos: 'A', rol: 'SUPERVISOR' });
    enviar(fixture);
    expect(emitidos.length).toBe(0);

    formulario.patchValue({ password: 'clave-larga' });
    enviar(fixture);
    expect(emitidos[0]).toEqual({
      username: 'nuevo',
      nombres: 'N',
      apellidos: 'A',
      rol: 'SUPERVISOR',
      password: 'clave-larga',
    });
  });

  it('en la edición precarga los datos y no pide ni envía contraseña', () => {
    const { fixture, emitidos } = montar(existente);
    expect(fixture.nativeElement.querySelector('input[type=password]')).toBeNull();
    enviar(fixture);
    expect(emitidos[0]).toEqual({
      username: 'jcondor',
      nombres: 'Juan',
      apellidos: 'Cóndor',
      rol: 'SUPERVISOR',
    });
  });

  it('pinta el error del servidor en el campo y su mensaje arriba', () => {
    const { fixture } = montar(null);
    fixture.componentRef.setInput(
      'error',
      new ErrorApi(400, 'USUARIO_YA_EXISTE', 'El nombre de usuario ya está registrado', {
        username: 'Ya existe',
      }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'El nombre de usuario ya está registrado',
    );
  });
});
