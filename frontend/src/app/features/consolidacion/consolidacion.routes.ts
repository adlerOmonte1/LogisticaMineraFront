import { Routes } from '@angular/router';

/**
 * `/consolidacion` (docs/pantallas.md §1), de gestión: el guard de `CONSOLIDAR` está en el padre.
 * El periodo va en la URL (`?anio=&mes=`).
 */
export const CONSOLIDACION_ROUTES: Routes = [
  {
    path: '',
    title: 'Consolidación',
    loadComponent: () => import('./pages/consolidacion/consolidacion.page').then((m) => m.ConsolidacionPage),
  },
];
