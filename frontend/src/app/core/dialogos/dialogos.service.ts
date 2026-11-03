import { ComponentType } from '@angular/cdk/portal';
import { Injectable, Injector, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

import {
  DatosConfirmacion,
  DialogoConfirmacionComponent,
} from '@shared/components/dialogo-confirmacion/dialogo-confirmacion.component';

const ANCHO_DIALOGO = '560px';

/** Apertura uniforme de diálogos: mismo ancho, foco y cierre en toda la aplicación. */
@Injectable({ providedIn: 'root' })
export class DialogosService {
  private readonly dialogo = inject(MatDialog);
  private readonly injector = inject(Injector);

  abrir<C, D, R>(componente: ComponentType<C>, datos: D): Observable<R | undefined> {
    return this.dialogo
      .open<C, D, R>(componente, {
        data: datos,
        width: ANCHO_DIALOGO,
        maxWidth: '96vw',
        autoFocus: 'first-tabbable',
        injector: this.injector,
      })
      .afterClosed();
  }

  confirmar(datos: DatosConfirmacion): Observable<boolean> {
    return this.abrir<DialogoConfirmacionComponent, DatosConfirmacion, boolean>(
      DialogoConfirmacionComponent,
      datos,
    ).pipe(map((respuesta) => respuesta === true));
  }
}
