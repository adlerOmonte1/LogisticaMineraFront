import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marca una petición que no lleva sesión (inicio de sesión, cierre, renovación): los
 * interceptores no le adjuntan el token ni tratan su 401 como sesión vencida.
 */
export const PETICION_SIN_SESION = new HttpContextToken<boolean>(() => false);

export function contextoSinSesion(): HttpContext {
  return new HttpContext().set(PETICION_SIN_SESION, true);
}
