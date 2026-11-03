import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsPe from '@angular/common/locales/es-PE';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';

import { erroresInterceptor } from '@core/errores/errores.interceptor';
import { TituloPaginaStrategy } from '@core/layout/titulo-pagina.strategy';
import { autenticacionInterceptor } from '@core/sesion/autenticacion.interceptor';
import { provideSesion } from '@core/sesion/provide-sesion';
import { routes } from './app.routes';

registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    { provide: TitleStrategy, useClass: TituloPaginaStrategy },
    // El orden importa: autenticación adjunta (y renueva) el token; errores traduce la
    // respuesta al cuerpo uniforme {codigo, mensaje, detalles} (D-23).
    provideHttpClient(withInterceptors([autenticacionInterceptor, erroresInterceptor])),
    provideAnimationsAsync(),
    provideSesion(),
    { provide: LOCALE_ID, useValue: 'es-PE' },
  ],
};
