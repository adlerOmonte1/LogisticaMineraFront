import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';

import { API_URL } from '../http/api-url.token';
import { PETICION_SIN_SESION } from '../http/contexto-http';
import { RenovacionSesionService } from './renovacion-sesion.service';
import { SesionService } from './sesion.service';

/**
 * Adjunta `Authorization: Bearer` solo a la API propia —nunca a un tercero— y, antes de
 * enviar, renueva el `access` si corresponde (D-F20).
 */
export const autenticacionInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const esDeLaApi = peticion.url.startsWith(inject(API_URL));
  if (!esDeLaApi || peticion.context.get(PETICION_SIN_SESION)) {
    return siguiente(peticion);
  }
  const sesion = inject(SesionService);
  return inject(RenovacionSesionService)
    .renovarSiCorresponde()
    .pipe(
      switchMap(() => {
        const access = sesion.access;
        return siguiente(
          access ? peticion.clone({ setHeaders: { Authorization: `Bearer ${access}` } }) : peticion,
        );
      }),
    );
};
