import { Routes } from '@angular/router';

/**
 * Rutas de `/consulta`. El detalle de un ingreso lo abren los enlaces del inicio y los avisos
 * (`/consulta/ingresos/{id}`, D-F13); la pestaña va en la URL. El listado, la búsqueda y el
 * calendario se suman en FB6.
 */
export const CONSULTA_ROUTES: Routes = [
  {
    path: 'ingresos/:id',
    title: 'Detalle del ingreso',
    loadComponent: () =>
      import('./pages/detalle-ingreso/detalle-ingreso.page').then((m) => m.DetalleIngresoPage),
  },
  {
    path: 'ingresos/:id/:pestana',
    title: 'Detalle del ingreso',
    loadComponent: () =>
      import('./pages/detalle-ingreso/detalle-ingreso.page').then((m) => m.DetalleIngresoPage),
  },
];
