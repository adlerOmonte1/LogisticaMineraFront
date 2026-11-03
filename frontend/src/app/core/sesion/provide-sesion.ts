import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import { RenovacionSesionService } from './renovacion-sesion.service';

/** Arranca la vigilancia de la sesión al iniciar la aplicación. */
export function provideSesion(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => inject(RenovacionSesionService).vigilar(),
    },
  ]);
}
