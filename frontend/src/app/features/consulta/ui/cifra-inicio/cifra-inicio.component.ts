import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/**
 * Una cifra del inicio. Si el servidor manda `enlace` la cifra lleva a su pantalla; si manda
 * `null` —porque el rol no tiene esa pantalla— es solo un dato, sin enlace (HU-M07-04 CA11).
 * Presentacional.
 */
@Component({
  selector: 'app-cifra-inicio',
  standalone: true,
  imports: [NgTemplateOutlet, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (enlace(); as ruta) {
      <a class="tarjeta cifra cifra--enlace" [routerLink]="ruta" data-prueba="cifra-enlace">
        <ng-container *ngTemplateOutlet="contenido" />
      </a>
    } @else {
      <div class="tarjeta cifra" data-prueba="cifra-sin-enlace">
        <ng-container *ngTemplateOutlet="contenido" />
      </div>
    }
    <ng-template #contenido>
      <mat-icon class="cifra__icono" aria-hidden="true">{{ icono() }}</mat-icon>
      <span class="cifra__etiqueta" data-prueba="cifra-etiqueta">{{ etiqueta() }}</span>
      <strong class="cifra__valor" data-prueba="cifra-valor">{{ valor() }}</strong>
      @if (detalle(); as texto) {
        <span class="cifra__detalle texto-secundario" data-prueba="cifra-detalle">{{ texto }}</span>
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: flex;
    }
    .cifra {
      display: grid;
      flex: 1;
      align-content: start;
      gap: 2px;
      color: var(--label);
      text-decoration: none;
    }
    .cifra--enlace:hover,
    .cifra--enlace:focus-visible {
      border-color: var(--gold);
    }
    .cifra__icono {
      color: var(--accent);
    }
    .cifra__etiqueta {
      color: var(--label-2);
      font-size: 0.85rem;
    }
    .cifra__valor {
      font-size: 1.8rem;
      line-height: 1.1;
    }
    .cifra__detalle {
      font-size: 0.85rem;
    }
  `,
})
export class CifraInicioComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string>();
  readonly icono = input('analytics');
  readonly detalle = input<string | null>(null);
  readonly enlace = input<string | null>(null);
}
