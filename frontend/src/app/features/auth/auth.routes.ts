import { Routes } from '@angular/router';

import { rutaPendiente } from '@core/layout/rutas-pendientes';

/** Rutas de `/administracion` (HU-M01-02, HU-M01-03; la auditoría llega en FB4). */
export const ADMINISTRACION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/administracion/administracion.page').then((m) => m.AdministracionPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      {
        path: 'usuarios',
        title: 'Usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.page').then((m) => m.UsuariosPage),
      },
      {
        path: 'permisos',
        title: 'Permisos',
        loadComponent: () => import('./pages/permisos/permisos.page').then((m) => m.PermisosPage),
      },
      rutaPendiente('auditoria', 'Auditoría', 'FB4', 'CONSULTAR_AUDITORIA'),
    ],
  },
];
