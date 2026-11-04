import { Routes } from '@angular/router';

import { claveTemporalGuard, permisoGuard } from '@core/guards/sesion.guards';
import { ArmazonComponent } from '@core/layout/armazon/armazon.component';
import { provideInterfaz } from '@core/layout/provide-interfaz';
import { RUTAS_PENDIENTES } from '@core/layout/rutas-pendientes';

/**
 * Pantallas con sesión, dentro del armazón (docs/pantallas.md §1). Se carga en diferido para
 * que el inicio de sesión no descargue el menú, el armazón ni Material.
 */
export const RUTAS_CON_SESION: Routes = [
  {
    path: '',
    component: ArmazonComponent,
    providers: provideInterfaz(),
    children: [
      {
        path: 'cuenta/clave',
        title: 'Cambiar contraseña',
        loadComponent: () =>
          import('./features/auth/pages/cambiar-clave/cambiar-clave.page').then((m) => m.CambiarClavePage),
      },
      {
        path: '',
        canActivateChild: [claveTemporalGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'inicio' },
          {
            path: 'inicio',
            title: 'Inicio',
            loadComponent: () =>
              import('./features/consulta/pages/inicio/inicio.page').then((m) => m.InicioPage),
          },
          {
            path: 'ingresos',
            loadChildren: () => import('./features/ingresos/ingresos.routes').then((m) => m.INGRESOS_ROUTES),
          },
          {
            path: 'consulta',
            canActivate: [permisoGuard('CONSULTAR')],
            loadChildren: () => import('./features/consulta/consulta.routes').then((m) => m.CONSULTA_ROUTES),
          },
          {
            path: 'catalogos',
            canActivate: [permisoGuard('GESTIONAR_CATALOGO')],
            loadChildren: () => import('./features/catalogo/catalogo.routes').then((m) => m.CATALOGO_ROUTES),
          },
          {
            path: 'administracion',
            canActivate: [permisoGuard('GESTIONAR_USUARIOS')],
            loadChildren: () => import('./rutas-administracion.routes').then((m) => m.RUTAS_ADMINISTRACION),
          },
          {
            path: 'acceso-denegado',
            title: 'Acción no autorizada',
            loadComponent: () =>
              import('@core/layout/paginas/acceso-denegado.page').then((m) => m.AccesoDenegadoPage),
          },
          ...RUTAS_PENDIENTES,
          { path: '**', redirectTo: 'inicio' },
        ],
      },
    ],
  },
];
