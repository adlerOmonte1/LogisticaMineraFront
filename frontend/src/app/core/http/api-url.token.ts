import { InjectionToken } from '@angular/core';
import { environment } from '@env/environment';

/**
 * Base de la API. Se inyecta en lugar de leer `environment` en cada servicio, para que las
 * pruebas y los entornos la sustituyan sin tocar el código (inversión de dependencias).
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
