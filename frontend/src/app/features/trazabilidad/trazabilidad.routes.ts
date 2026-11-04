import { Routes } from '@angular/router';

import { permisoGuard } from '@core/guards/sesion.guards';

/**
 * Rutas de `/lotes` (docs/pantallas.md §1). `nuevo` y `cierre` van antes de `:id` para que no
 * se lean como identificador. `:id` y `:id/cerrar` son las que fabrica el servidor en sus
 * enlaces y no se renombran (D-F13). Cada una se protege con el permiso, no con una lista de
 * roles (D-F24); el servidor lo rechaza igual.
 */
export const TRAZABILIDAD_ROUTES: Routes = [
  {
    path: '',
    title: 'Trazabilidad',
    loadComponent: () => import('./pages/lotes/lotes.page').then((m) => m.LotesPage),
  },
  {
    path: 'nuevo',
    title: 'Abrir lote',
    canActivate: [permisoGuard('COMPONER_LOTE')],
    loadComponent: () => import('./pages/abrir-lote/abrir-lote.page').then((m) => m.AbrirLotePage),
  },
  {
    path: 'cierre',
    title: 'Cierre de lotes',
    canActivate: [permisoGuard('CERRAR_LOTE')],
    loadComponent: () => import('./pages/cierre-lotes/cierre-lotes.page').then((m) => m.CierreLotesPage),
  },
  {
    path: ':id',
    title: 'Detalle del lote',
    loadComponent: () => import('./pages/lote-detalle/lote-detalle.page').then((m) => m.LoteDetallePage),
  },
  {
    path: ':id/cerrar',
    title: 'Cerrar lote',
    canActivate: [permisoGuard('CERRAR_LOTE')],
    loadComponent: () => import('./pages/cerrar-lote/cerrar-lote.page').then((m) => m.CerrarLotePage),
  },
];
