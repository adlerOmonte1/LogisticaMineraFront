import { Routes } from '@angular/router';

import { invitadoGuard, sesionGuard } from '@core/guards/sesion.guards';

/**
 * Raíz de las rutas. Solo los guards se cargan en el arranque; el inicio de sesión y las
 * pantallas con sesión van en diferido, cada una con su configuración de Material.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadChildren: () => import('./features/auth/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: '',
    canActivate: [sesionGuard],
    loadChildren: () => import('./rutas-con-sesion.routes').then((m) => m.RUTAS_CON_SESION),
  },
];
