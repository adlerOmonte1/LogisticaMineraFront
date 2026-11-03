import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { ErrorApi } from '@models/error-api.model';
import { UsuarioResumen } from '@models/usuario.model';
import { paginaDe } from '../../../../testing/fabricas';
import { UsuariosApiService } from '../../data-access/usuarios-api.service';
import { DialogoClaveTemporalComponent } from '../../ui/dialogo-clave-temporal.component';
import { UsuariosPage } from './usuarios.page';

describe('UsuariosPage', () => {
  const usuario: UsuarioResumen = {
    id: 9,
    username: 'jcondor',
    nombres: 'Juan',
    apellidos: 'Cóndor',
    rol: 'SUPERVISOR',
    is_active: true,
  };
  let api: jasmine.SpyObj<UsuariosApiService>;
  let dialogos: jasmine.SpyObj<DialogosService>;
  let notificacion: jasmine.SpyObj<NotificacionService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<UsuariosApiService>('UsuariosApiService', [
      'listar',
      'obtener',
      'crear',
      'editar',
      'desactivar',
      'reactivar',
      'restablecerClave',
    ]);
    api.listar.and.returnValue(of(paginaDe([usuario])));
    dialogos = jasmine.createSpyObj<DialogosService>('DialogosService', ['abrir', 'confirmar']);
    notificacion = jasmine.createSpyObj<NotificacionService>('NotificacionService', ['exito', 'rechazo']);
    TestBed.configureTestingModule({
      imports: [UsuariosPage],
      providers: [
        provideNoopAnimations(),
        { provide: UsuariosApiService, useValue: api },
        { provide: DialogosService, useValue: dialogos },
        { provide: NotificacionService, useValue: notificacion },
      ],
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(UsuariosPage);
    fixture.detectChanges();
    return fixture;
  }

  it('carga la lista y la muestra', () => {
    const fixture = montar();
    expect(api.listar).toHaveBeenCalledWith({ rol: null, incluir_inactivos: false }, 1);
    expect(fixture.nativeElement.textContent).toContain('jcondor');
  });

  it('filtra por rol y por inactivos desde la primera página', () => {
    const fixture = montar();
    fixture.componentInstance.filtrarPorRol('ADMINISTRADOR');
    fixture.componentInstance.mostrarInactivos(true);
    expect(api.listar).toHaveBeenCalledWith({ rol: 'ADMINISTRADOR', incluir_inactivos: true }, 1);
  });

  it('desactiva tras confirmar y muestra el mensaje del servidor (HU-M01-02 CA03)', () => {
    dialogos.confirmar.and.returnValue(of(true));
    api.desactivar.and.returnValue(
      of({ ...usuario, is_active: false, date_joined: '', mensaje: 'Usuario desactivado' }),
    );
    montar().componentInstance.desactivar(usuario);
    expect(api.desactivar).toHaveBeenCalledWith(9);
    expect(notificacion.exito).toHaveBeenCalledWith('Usuario desactivado');
  });

  it('si no se confirma, no hace nada', () => {
    dialogos.confirmar.and.returnValue(of(false));
    montar().componentInstance.reactivar(usuario);
    expect(api.reactivar).not.toHaveBeenCalled();
  });

  it('un rechazo (desactivar la propia cuenta) se muestra literal (CA09)', () => {
    const error = new ErrorApi(400, 'DESACTIVAR_PROPIA', 'No puede desactivar su propia cuenta');
    dialogos.confirmar.and.returnValue(of(true));
    api.desactivar.and.returnValue(throwError(() => error));
    montar().componentInstance.desactivar(usuario);
    expect(notificacion.rechazo).toHaveBeenCalledWith(error);
  });

  it('restablece la clave y la muestra una vez (CA08)', () => {
    dialogos.confirmar.and.returnValue(of(true));
    dialogos.abrir.and.returnValue(of(undefined));
    api.restablecerClave.and.returnValue(of({ username: 'jcondor', clave_temporal: 'Tmp-1234' }));
    montar().componentInstance.restablecerClave(usuario);
    expect(dialogos.abrir).toHaveBeenCalledWith(DialogoClaveTemporalComponent, {
      username: 'jcondor',
      clave_temporal: 'Tmp-1234',
    });
  });

  it('crear y editar abren el formulario y recargan al guardar', () => {
    dialogos.abrir.and.returnValue(of({ ...usuario, date_joined: '' }));
    api.obtener.and.returnValue(of({ ...usuario, date_joined: '' }));
    const fixture = montar();
    fixture.componentInstance.crear();
    fixture.componentInstance.editar(usuario);
    expect(dialogos.abrir).toHaveBeenCalledTimes(2);
    expect(api.listar).toHaveBeenCalledTimes(3);
  });
});
