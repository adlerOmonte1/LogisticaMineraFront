import { InjectionToken } from '@angular/core';

/** Hora actual en milisegundos. Inyectable para que las pruebas controlen el tiempo. */
export type Reloj = () => number;

export const RELOJ = new InjectionToken<Reloj>('RELOJ', {
  providedIn: 'root',
  factory: () => () => Date.now(),
});
