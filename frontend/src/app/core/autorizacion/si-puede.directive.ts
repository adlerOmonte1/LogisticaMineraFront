import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

import { AutorizacionService } from './autorizacion.service';
import { Permiso } from './permisos';

/**
 * Muestra el contenido solo si el rol de la sesión tiene el permiso:
 * `<button *appSiPuede="'MODIFICAR_TARA'">`. No reemplaza el 403 del servidor.
 */
@Directive({
  selector: '[appSiPuede]',
  standalone: true,
})
export class SiPuedeDirective {
  readonly appSiPuede = input.required<Permiso>();

  private readonly autorizacion = inject(AutorizacionService);
  private readonly plantilla = inject(TemplateRef<unknown>);
  private readonly contenedor = inject(ViewContainerRef);
  private visible = false;

  constructor() {
    effect(() => {
      const puede = this.autorizacion.puede(this.appSiPuede());
      if (puede && !this.visible) {
        // La vista nace dentro de un `effect`, fuera de una pasada de detección de cambios: sin
        // `detectChanges()` sus componentes hijos (mat-icon…) no ejecutarían su inicialización.
        this.contenedor.createEmbeddedView(this.plantilla).detectChanges();
      } else if (!puede && this.visible) {
        this.contenedor.clear();
      }
      this.visible = puede;
    });
  }
}
