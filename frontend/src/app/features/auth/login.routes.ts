import { Routes } from '@angular/router';

import { provideInterfaz } from '@core/layout/provide-interfaz';

/** Inicio de sesión (HU-M01-01), fuera del armazón. */
export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    title: 'Inicia sesión',
    providers: provideInterfaz(),
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
];
