import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { CODIGO_ERROR, ErrorApi } from '@models/error-api.model';
import { PETICION_SIN_SESION } from '../http/contexto-http';
import { NotificacionService } from '../notificacion/notificacion.service';
import { AutenticacionService, RUTA_CAMBIO_CLAVE } from '../sesion/autenticacion.service';
import { SesionService } from '../sesion/sesion.service';
import { traducirErrorHttp } from './traductor-error';

/**
 * Traduce todo error HTTP a `ErrorApi` y resuelve los que son del núcleo, no de una pantalla:
 * sesión terminada (401), contraseña temporal pendiente y rol sin permiso (403), red caída y
 * fallas del servidor. Los 400, 404 y 409 los pinta la pantalla que hizo la petición.
 */
export const erroresInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const autenticacion = inject(AutenticacionService);
  const sesion = inject(SesionService);
  const router = inject(Router);
  const notificacion = inject(NotificacionService);
  const conSesion = !peticion.context.get(PETICION_SIN_SESION);

  const atender = (error: ErrorApi): void => {
    if (error.status === 401 && conSesion && sesion.autenticado()) {
      autenticacion.expirarSesion(error.mensaje);
    } else if (error.codigo === CODIGO_ERROR.claveTemporalPendiente) {
      sesion.marcarClaveTemporalPendiente();
      void router.navigateByUrl(RUTA_CAMBIO_CLAVE);
    } else if (error.status === 403 || error.esDeRed || error.status >= 500) {
      notificacion.error(error.mensaje);
    }
  };

  return siguiente(peticion).pipe(
    catchError((respuesta: unknown) => {
      if (!(respuesta instanceof HttpErrorResponse)) {
        return throwError(() => respuesta);
      }
      return from(traducirErrorHttp(respuesta)).pipe(
        switchMap((error) => {
          atender(error);
          return throwError(() => error);
        }),
      );
    }),
  );
};
