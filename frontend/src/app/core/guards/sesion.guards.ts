import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { AutorizacionService } from '../autorizacion/autorizacion.service';
import { Permiso } from '../autorizacion/permisos';
import { RUTA_CAMBIO_CLAVE, RUTA_INICIO_SESION, RUTA_PRINCIPAL } from '../sesion/autenticacion.service';
import { SesionService } from '../sesion/sesion.service';

export const RUTA_ACCESO_DENEGADO = '/acceso-denegado';

/** Sin sesión, al inicio de sesión. */
export const sesionGuard: CanActivateFn = () =>
  inject(SesionService).autenticado() || inject(Router).parseUrl(RUTA_INICIO_SESION);

/** Con sesión, el inicio de sesión no tiene sentido: a la pantalla de entrada. */
export const invitadoGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  if (!sesion.autenticado()) {
    return true;
  }
  return inject(Router).parseUrl(sesion.debeCambiarClave() ? RUTA_CAMBIO_CLAVE : RUTA_PRINCIPAL);
};

/** Con la contraseña temporal pendiente, solo se puede cambiarla (HU-M01-01 CA09). */
export const claveTemporalGuard: CanActivateFn & CanActivateChildFn = () =>
  !inject(SesionService).debeCambiarClave() || inject(Router).parseUrl(RUTA_CAMBIO_CLAVE);

/**
 * Fábrica: el permiso es un dato de la ruta, no del guard. Un rol sin permiso ve «Acción no
 * autorizada» en lugar de una pantalla vacía (HU-M01-03 CA02); el servidor la rechaza igual.
 */
export function permisoGuard(permiso: Permiso): CanActivateFn {
  return () => inject(AutorizacionService).puede(permiso) || inject(Router).parseUrl(RUTA_ACCESO_DENEGADO);
}
