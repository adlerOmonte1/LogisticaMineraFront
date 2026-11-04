import { Route, Routes } from '@angular/router';

/**
 * Rutas de `/administracion` (HU-M01-02, HU-M01-03): Usuarios y Permisos son de este feature.
 * Las demás pestañas —hoy la Auditoría, de M09— las aporta quien monta la ruta
 * (`rutas-administracion.routes.ts`), porque un feature no importa de otro.
 */
export function rutasAdministracion(pestanasDeOtrosFeatures: readonly Route[] = []): Routes {
  return [
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
        ...pestanasDeOtrosFeatures,
      ],
    },
  ];
}
