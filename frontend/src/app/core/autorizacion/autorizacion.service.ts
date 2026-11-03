import { Injectable, inject } from '@angular/core';

import { SesionService } from '../sesion/sesion.service';
import { Permiso, rolTienePermiso } from './permisos';

/**
 * ¿Puede el usuario de la sesión hacer esto? Lee el rol de un signal, así que usado en una
 * plantilla o en un `computed` reacciona solo al cambiar la sesión. Es experiencia de usuario:
 * quien decide es el servidor (HU-M01-03 CA02).
 */
@Injectable({ providedIn: 'root' })
export class AutorizacionService {
  private readonly sesion = inject(SesionService);

  puede(permiso: Permiso): boolean {
    return rolTienePermiso(this.sesion.rol(), permiso);
  }
}
