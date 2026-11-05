import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, fromEvent, merge, of } from 'rxjs';

import { AvisosService } from '../../consulta/avisos.service';

/** Con más avisos que esto el contador dice «9+». */
const TOPE_CONTADOR = 9;

/**
 * Campana de avisos de la cabecera (HU-M07-04 CA06 a CA10): contador, panel y, en cada aviso, un
 * paso a la pantalla que lo resuelve. Los avisos los decide el servidor según el rol. Se
 * recargan al abrir la sesión, al volver a la pestaña del navegador, tras cada navegación
 * —un registro o un destare propio termina navegando— y al abrir el panel (RNF-M07-16).
 */
@Component({
  selector: 'app-campana-avisos',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      mat-icon-button
      type="button"
      data-prueba="campana"
      [matMenuTriggerFor]="panel"
      [attr.aria-label]="etiqueta()"
      [matBadge]="contador()"
      [matBadgeHidden]="cantidad() === 0"
      matBadgeColor="warn"
      matBadgeSize="small"
      (menuOpened)="servicio.recargar()"
    >
      <mat-icon aria-hidden="true">notifications</mat-icon>
    </button>
    <mat-menu #panel="matMenu" class="panel-avisos">
      @if (cantidad() === 0) {
        <p class="vacio" data-prueba="sin-avisos">{{ servicio.mensaje() ?? 'Sin avisos' }}</p>
      }
      @for (aviso of servicio.avisos(); track $index) {
        <a mat-menu-item class="aviso" [routerLink]="aviso.enlace" data-prueba="aviso">
          <span class="aviso__titulo" data-prueba="aviso-titulo">{{ aviso.titulo }}</span>
          <span class="aviso__detalle">{{ aviso.detalle }}</span>
        </a>
      }
      @if (servicio.fallo()) {
        <p class="vacio" role="status" data-prueba="aviso-fallo">No se pudieron actualizar los avisos</p>
      }
    </mat-menu>
  `,
  styles: `
    .vacio {
      margin: 0;
      padding: 12px 16px;
      color: var(--label-2);
    }
    .aviso {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      height: auto;
      min-height: 52px;
      padding-block: 8px;
    }
    .aviso__titulo,
    .aviso__detalle {
      display: block;
      white-space: normal;
    }
    .aviso__titulo {
      font-weight: 600;
    }
    .aviso__detalle {
      color: var(--label-2);
      font-size: 0.85rem;
    }
  `,
})
export class CampanaAvisosComponent {
  protected readonly servicio = inject(AvisosService);

  protected readonly cantidad = computed(() => this.servicio.avisos().length);
  protected readonly contador = computed(() =>
    this.cantidad() > TOPE_CONTADOR ? `${TOPE_CONTADOR}+` : this.cantidad(),
  );
  protected readonly etiqueta = computed(() =>
    this.cantidad() === 0
      ? 'Avisos: nada pendiente'
      : `Avisos: ${this.cantidad()} ${this.cantidad() === 1 ? 'pendiente' : 'pendientes'}`,
  );

  constructor() {
    const documento = inject(DOCUMENT);
    merge(
      of(null),
      inject(Router).events.pipe(filter((evento) => evento instanceof NavigationEnd)),
      fromEvent(documento, 'visibilitychange').pipe(filter(() => documento.visibilityState === 'visible')),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.servicio.recargar());
    // Al cerrar la sesión el armazón se destruye: no debe quedar nada del usuario anterior.
    inject(DestroyRef).onDestroy(() => this.servicio.limpiar());
  }
}
