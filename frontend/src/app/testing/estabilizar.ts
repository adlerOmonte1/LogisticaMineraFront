import { ComponentFixture } from '@angular/core/testing';

/**
 * Varias pasadas de detección de cambios: los `effect` y `toSignal(toObservable(...))` de los
 * componentes publican su resultado en la pasada siguiente a la que los ejecuta.
 */
export function estabilizar(fixture: ComponentFixture<unknown>, pasadas = 3): void {
  for (let i = 0; i < pasadas; i++) {
    fixture.detectChanges();
  }
}
