import { Pipe, PipeTransform } from '@angular/core';

import { ETIQUETA_ROL, Rol } from '@models/rol.model';

@Pipe({ name: 'etiquetaRol', standalone: true })
export class EtiquetaRolPipe implements PipeTransform {
  transform(rol: Rol | null | undefined): string {
    return rol ? ETIQUETA_ROL[rol] : '—';
  }
}
