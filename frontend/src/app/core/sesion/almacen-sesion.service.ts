import { Injectable } from '@angular/core';

import { UsuarioSesion } from '@models/usuario.model';

export interface SesionGuardada {
  access: string;
  refresh: string;
  usuario: UsuarioSesion;
}

const CLAVE = 'consmin.sesion';

/**
 * Persistencia de la sesión en `localStorage` (D-F02, revisada en D-F20). Si el navegador no
 * permite almacenar —modo privado, cuota—, la sesión sigue en memoria y se pierde al recargar.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenSesionService {
  leer(): SesionGuardada | null {
    try {
      const texto = localStorage.getItem(CLAVE);
      return texto ? (JSON.parse(texto) as SesionGuardada) : null;
    } catch {
      return null;
    }
  }

  guardar(sesion: SesionGuardada): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
      // Sin almacenamiento disponible: la sesión vive solo en memoria.
    }
  }

  borrar(): void {
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      // Nada que borrar.
    }
  }
}
