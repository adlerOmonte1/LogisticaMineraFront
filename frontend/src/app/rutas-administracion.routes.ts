import { Routes } from '@angular/router';

import { AUDITORIA_ROUTES } from './features/auditoria/auditoria.routes';
import { rutasAdministracion } from './features/auth/auth.routes';

/**
 * `/administracion`: Usuarios y Permisos (M01) más la pestaña Auditoría (M09). Se arma aquí, fuera
 * de los features, para que ninguno importe de otro (D-F22).
 */
export const RUTAS_ADMINISTRACION: Routes = rutasAdministracion([
  { path: 'auditoria', children: AUDITORIA_ROUTES },
]);
