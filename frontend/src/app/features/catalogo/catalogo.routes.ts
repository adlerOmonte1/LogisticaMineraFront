import { Routes } from '@angular/router';

/** Rutas de `/catalogos` (HU-M02-01 a HU-M02-03). El permiso se aplica al montar el feature. */
export const CATALOGO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/catalogos.page').then((m) => m.CatalogosPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'vehiculos' },
      {
        path: 'vehiculos',
        title: 'Vehículos',
        loadComponent: () => import('./pages/vehiculos/vehiculos.page').then((m) => m.VehiculosPage),
      },
      {
        path: 'tipos-mineral',
        title: 'Tipos de mineral',
        loadComponent: () =>
          import('./pages/tipos-mineral/tipos-mineral.page').then((m) => m.TiposMineralPage),
      },
      {
        path: 'transportistas',
        title: 'Transportistas',
        loadComponent: () =>
          import('./pages/transportistas/transportistas.page').then((m) => m.TransportistasPage),
      },
    ],
  },
];
