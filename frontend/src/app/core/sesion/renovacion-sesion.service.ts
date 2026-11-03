import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, finalize, interval, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { ActividadUsuarioService } from './actividad-usuario.service';
import { debeRenovar } from './politica-renovacion';
import { RELOJ } from './reloj';
import { SesionApiService } from './sesion-api.service';
import { SesionService } from './sesion.service';

const INTERVALO_VIGILANCIA_MS = 60 * 1000;

/**
 * Mantiene vivo el `access` mientras el usuario trabaja. Si varias peticiones lo necesitan a
 * la vez, comparten una sola renovación.
 */
@Injectable({ providedIn: 'root' })
export class RenovacionSesionService {
  private readonly sesion = inject(SesionService);
  private readonly api = inject(SesionApiService);
  private readonly actividad = inject(ActividadUsuarioService);
  private readonly reloj = inject(RELOJ);
  private readonly destroyRef = inject(DestroyRef);

  private renovacionEnCurso: Observable<void> | null = null;

  /**
   * Renueva si corresponde y termina sin valor. Nunca falla: si la renovación no se logra, la
   * petición sigue con el token actual y el servidor decide.
   */
  renovarSiCorresponde(): Observable<void> {
    const refresh = this.sesion.refresh;
    const corresponde =
      refresh !== null &&
      debeRenovar({
        ahora: this.reloj(),
        vencimientoAccess: this.sesion.vencimientoAccess,
        ultimaActividad: this.actividad.ultimaActividad,
      });
    if (!corresponde) {
      return of(undefined);
    }
    this.renovacionEnCurso ??= this.api.renovar(refresh).pipe(
      tap((access) => this.sesion.actualizarAccess(access)),
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => (this.renovacionEnCurso = null)),
      shareReplay(1),
    );
    return this.renovacionEnCurso;
  }

  /**
   * Revisa cada minuto: un usuario que llena un formulario largo sin hacer peticiones también
   * está trabajando, y su sesión no debe vencer a mitad del formulario.
   */
  vigilar(): void {
    interval(INTERVALO_VIGILANCIA_MS)
      .pipe(
        switchMap(() => this.renovarSiCorresponde()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
