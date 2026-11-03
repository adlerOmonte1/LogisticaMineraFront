import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ErrorApi } from '@models/error-api.model';
import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  let servicio: NotificacionService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snackBar }] });
    servicio = TestBed.inject(NotificacionService);
  });

  it('muestra el mensaje tal cual, con la clase de su tipo', async () => {
    servicio.exito('Usuario reactivado');
    await new Promise((resolver) => setTimeout(resolver));
    expect(snackBar.open).toHaveBeenCalledWith(
      'Usuario reactivado',
      'Cerrar',
      jasmine.objectContaining({ panelClass: 'aviso-exito' }),
    );
  });

  it('un rechazo muestra el mensaje de un 400 o 409, pero no repite lo que avisó el interceptor', async () => {
    servicio.rechazo(new ErrorApi(400, 'DESACTIVAR_PROPIA', 'No puede desactivar su propia cuenta'));
    servicio.rechazo(new ErrorApi(403, 'ACCION_NO_AUTORIZADA', 'Acción no autorizada'));
    servicio.rechazo(new ErrorApi(0, 'SIN_CONEXION', 'Sin red'));
    servicio.rechazo(new Error('no es de la API'));
    await new Promise((resolver) => setTimeout(resolver));

    expect(snackBar.open).toHaveBeenCalledTimes(1);
    expect(snackBar.open.calls.mostRecent().args[0]).toBe('No puede desactivar su propia cuenta');
  });
});
