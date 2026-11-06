import { ChangeDetectionStrategy, Component, HostBinding, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SiguientePaso } from '@models/lote.model';
import { FichaComponent } from '@shared/components/ficha/ficha.component';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { TarjetaEtapa } from '../flujo-lote/flujo-lote';

/**
 * Una etapa del recorrido como tarjeta de la maqueta (`stCard`): completada (quién y cuándo, horas
 * de molienda, observación), siguiente (con el botón del `siguientes` del servidor), en espera o
 * pendiente. Presentacional.
 */
@Component({
  selector: 'app-tarjeta-etapa',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, FichaComponent, FechaLimaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cabeza">
      <span class="numero"
        ><mat-icon>{{ icono() }}</mat-icon></span
      >
      <h3 data-prueba="etapa-nombre">{{ tarjeta().nombre }}</h3>
    </div>
    @switch (tarjeta().estado) {
      @case ('ok') {
        <app-ficha color="green" data-prueba="etapa-estado">Completada</app-ficha>
        @if (tarjeta().paso; as paso) {
          <p class="registro" data-prueba="etapa-registro">
            {{ paso.fecha_hora | fechaLima }}, {{ paso.usuario }}
          </p>
          @if (paso.horas_molienda) {
            <p class="horas" data-prueba="horas">
              <b>{{ horas(paso.horas_molienda) }} h</b> de molienda
            </p>
          }
          @if (paso.observacion) {
            <p class="observacion">{{ paso.observacion }}</p>
          }
        }
      }
      @case ('next') {
        <app-ficha color="blue" data-prueba="etapa-estado">Siguiente etapa</app-ficha>
        @if (puedeRegistrar() && tarjeta().siguiente; as siguiente) {
          <button
            mat-flat-button
            color="primary"
            type="button"
            data-prueba="siguiente"
            (click)="registrar.emit(siguiente)"
          >
            Registrar {{ tarjeta().nombre.toLowerCase() }}
          </button>
        }
      }
      @case ('wait') {
        <app-ficha color="gray" data-prueba="etapa-estado">Espera el inicio del recorrido</app-ficha>
      }
      @default {
        <app-ficha color="gray" data-prueba="etapa-estado">Pendiente</app-ficha>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    :host(.hecha) {
      border-top: 3px solid var(--green);
    }
    :host(.siguiente) {
      border: 1px solid var(--gold);
      border-top: 3px solid var(--gold);
      background: color-mix(in srgb, var(--gold) 5%, var(--surface));
    }
    .cabeza {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }
    p {
      margin: 0;
    }
    .numero {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 3px;
      background: var(--fill-2);
      color: var(--label-2);
      .mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }
    }
    :host(.hecha) .numero {
      background: var(--green);
      color: #fff;
    }
    :host(.siguiente) .numero {
      background: var(--gold);
      color: var(--ink);
    }
    .registro {
      font-size: 13px;
      color: var(--label-2);
    }
    .horas {
      font-size: 13px;
    }
    .observacion {
      font-size: 12px;
      color: var(--label-3);
    }
  `,
})
export class TarjetaEtapaComponent {
  readonly tarjeta = input.required<TarjetaEtapa>();
  readonly puedeRegistrar = input(false);

  readonly registrar = output<SiguientePaso>();

  @HostBinding('attr.data-prueba') protected readonly prueba = 'etapa';

  @HostBinding('class.hecha')
  protected get hecha(): boolean {
    return this.tarjeta().estado === 'ok';
  }

  @HostBinding('class.siguiente')
  protected get siguiente(): boolean {
    return this.tarjeta().estado === 'next';
  }

  protected readonly icono = computed(() => {
    const t = this.tarjeta();
    return t.paso ? 'check' : t.etapa === 'ENSACADO' ? 'inventory_2' : 'schedule';
  });

  protected horas(valor: string): string {
    return valor.replace(/\.00$/, '');
  }
}
