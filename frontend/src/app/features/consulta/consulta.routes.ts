import { Routes } from '@angular/router';

/**
 * Rutas de `/consulta` (docs/pantallas.md §1): la consulta por placa y fecha, el listado, el
 * calendario y el detalle de un ingreso. El detalle lo abren los enlaces del inicio y los avisos
 * (`/consulta/ingresos/{id}`, D-F13); la pestaña va en la URL. Todas las ve cualquier rol: el
 * guard de `CONSULTAR` está en el padre.
 */
export const CONSULTA_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Consulta',
    loadComponent: () =>
      import('./pages/consulta-placa-fecha/consulta-placa-fecha.page').then((m) => m.ConsultaPlacaFechaPage),
  },
  {
    path: 'ingresos',
    pathMatch: 'full',
    title: 'Ingresos',
    loadComponent: () =>
      import('./pages/listado-ingresos/listado-ingresos.page').then((m) => m.ListadoIngresosPage),
  },
  {
    path: 'calendario',
    title: 'Calendario',
    loadComponent: () => import('./pages/calendario/calendario.page').then((m) => m.CalendarioPage),
  },
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
