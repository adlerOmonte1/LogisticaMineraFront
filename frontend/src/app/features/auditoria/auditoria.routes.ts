import { Routes } from '@angular/router';

import { permisoGuard } from '@core/guards/sesion.guards';

/**
 * Auditoría del sistema (`/administracion/auditoria`, HU-M09-03). Solo la monta
 * `rutas-administracion.routes.ts`, dentro de las pestañas de Administración: un feature no
 * importa de otro. El filtro de la URL (`?texto=`) lo usa el enlace del historial de un ingreso.
 */
export const AUDITORIA_ROUTES: Routes = [
  {
    path: '',
    title: 'Auditoría',
    canActivate: [permisoGuard('CONSULTAR_AUDITORIA')],
    loadComponent: () => import('./pages/auditoria/auditoria.page').then((m) => m.AuditoriaPage),
  },
];
