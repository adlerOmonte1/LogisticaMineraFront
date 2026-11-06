import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

export type TonoCifra = 'blue' | 'green' | 'orange' | 'purple' | 'gray';

/**
 * Cifra destacada de la maqueta (`kpi`): etiqueta con su icono, el valor grande con su unidad y
 * una línea de apoyo. Con `enlace` es un vínculo a la pantalla de donde sale la cifra; sin él, un
 * dato. El color acompaña al icono, nunca al valor (RNF-M07-11). Presentacional.
 */
@Component({
  selector: 'app-cifra',
  standalone: true,
  imports: [NgTemplateOutlet, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (enlace(); as ruta) {
      <a class="cifra cifra--enlace" [routerLink]="ruta" data-prueba="cifra-enlace">
        <ng-container *ngTemplateOutlet="contenido" />
      </a>
    } @else {
      <div class="cifra" data-prueba="cifra-sin-enlace">
        <ng-container *ngTemplateOutlet="contenido" />
      </div>
    }
    <ng-template #contenido>
      <div class="cifra__cabeza">
        <span data-prueba="cifra-etiqueta">{{ etiqueta() }}</span>
        <mat-icon [class]="'cifra__icono cifra__icono--' + tono()" aria-hidden="true">{{ icono() }}</mat-icon>
      </div>
      <div class="cifra__valor" data-prueba="cifra-valor">
        {{ valor() }}
        @if (unidad()) {
          <small>{{ unidad() }}</small>
        }
      </div>
      @if (detalle(); as texto) {
        <div class="cifra__detalle" data-prueba="cifra-detalle">{{ texto }}</div>
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: flex;
    }
    .cifra {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      padding: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--label);
      text-decoration: none;
    }
    .cifra--enlace:hover,
    .cifra--enlace:focus-visible {
      border-color: var(--gold);
    }
    .cifra__cabeza {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--label-2);
    }
    .cifra__icono {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
    .cifra__icono--blue {
      color: var(--accent);
    }
    .cifra__icono--green {
      color: var(--green);
    }
    .cifra__icono--orange {
      color: var(--orange-b);
    }
    .cifra__icono--purple {
      color: var(--purple-b);
    }
    .cifra__icono--gray {
      color: var(--gray-b);
    }
    .cifra__valor {
      font: 700 34px/1.05 var(--font-d);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.005em;
      small {
        margin-left: 5px;
        font: 500 15px var(--font);
        color: var(--label-2);
      }
    }
    .cifra__detalle {
      font-size: 12.5px;
      color: var(--label-3);
    }
    @media (max-width: 767px) {
      .cifra {
        padding: 16px;
      }
      .cifra__valor {
        font-size: 28px;
      }
    }
  `,
})
export class CifraComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string>();
  readonly unidad = input<string | null>(null);
  readonly icono = input('analytics');
  readonly tono = input<TonoCifra>('blue');
  readonly detalle = input<string | null>(null);
  readonly enlace = input<string | null>(null);
}
