import { Routes } from '@angular/router';

import { permisoGuard } from '@core/guards/sesion.guards';

/**
 * Rutas de `/ingresos` (M03, con M04 y M05): el registro, los destares y las acciones sobre un
 * ingreso. Las rutas de destares y de «corregir/anular» las usan los enlaces que fabrica el
 * servidor y el detalle (D-F13).
 */
export const INGRESOS_ROUTES: Routes = [
  {
    path: 'registrar',
    title: 'Registrar ingreso',
    canActivate: [permisoGuard('REGISTRAR_INGRESO')],
    loadComponent: () =>
      import('./pages/registrar-ingreso/registrar-ingreso.page').then((m) => m.RegistrarIngresoPage),
  },
  {
    path: 'destares',
    title: 'Destares',
    canActivate: [permisoGuard('REGISTRAR_DESTARE')],
    loadComponent: () => import('./pages/destares/destares.page').then((m) => m.DestaresPage),
  },
  {
    path: ':id/corregir',
    title: 'Corregir ingreso',
    canActivate: [permisoGuard('CORREGIR_INGRESO')],
    loadComponent: () =>
      import('./pages/corregir-ingreso/corregir-ingreso.page').then((m) => m.CorregirIngresoPage),
  },
  {
    path: ':id/revertir',
    title: 'Revertir corrección',
    canActivate: [permisoGuard('CORREGIR_INGRESO')],
    loadComponent: () =>
      import('./pages/revertir-correccion/revertir-correccion.page').then((m) => m.RevertirCorreccionPage),
  },
  {
    path: ':id/anular',
    title: 'Anular ingreso',
    canActivate: [permisoGuard('ANULAR_INGRESO')],
    loadComponent: () =>
      import('./pages/anular-ingreso/anular-ingreso.page').then((m) => m.AnularIngresoPage),
  },
];
