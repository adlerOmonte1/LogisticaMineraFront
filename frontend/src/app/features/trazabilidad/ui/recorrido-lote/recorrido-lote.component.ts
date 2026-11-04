import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ParteLote, PasoRecorrido, RegistroBigbags } from '@models/lote.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Pasos ya registrados (quién, cuándo, qué carga) y bigbags asociados. El peso de cada bigbag es
 * aproximado y se muestra como estimación (HU-M06-02 CA11, RNF-M06-09). «Asociar bigbags» solo
 * se ofrece con el ensacado ya registrado (CA13). Presentacional.
 */
@Component({
  selector: 'app-recorrido-lote',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, FechaLimaPipe, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta" aria-labelledby="titulo-recorrido">
      <h2 id="titulo-recorrido" class="titulo">Recorrido</h2>
      @if (recorrido().length === 0) {
        <p class="texto-secundario" data-prueba="sin-pasos">Todavía no se registró ninguna etapa</p>
      } @else {
        <ol class="pasos">
          @for (paso of recorrido(); track paso.id) {
            <li class="paso" data-prueba="paso">
              <strong data-prueba="etapa">{{ paso.etapa_texto }}</strong>
              <span data-prueba="carga">{{ paso.carga }}</span>
              <span class="texto-secundario monoespaciado">{{ paso.fecha_hora | fechaLima }}</span>
              <span class="texto-secundario" data-prueba="usuario">{{ paso.usuario }}</span>
              @if (paso.horas_molienda) {
                <span data-prueba="horas">{{ paso.horas_molienda }} h de molienda</span>
              }
              @if (paso.observacion) {
                <span class="texto-secundario">{{ paso.observacion }}</span>
              }
            </li>
          }
        </ol>
      }

      <h3 class="subtitulo">Bigbags</h3>
      @if (bigbags().length === 0) {
        <p class="texto-secundario" data-prueba="sin-bigbags">Sin bigbags asociados</p>
      } @else {
        <ul class="pasos">
          @for (registro of bigbags(); track registro.id) {
            <li class="paso" data-prueba="bigbags">
              <strong>{{ registro.cantidad }} {{ registro.cantidad === 1 ? 'bigbag' : 'bigbags' }}</strong>
              <span>{{ nombreParte(registro) }}</span>
              <span class="monoespaciado" data-prueba="peso-bigbag">
                ≈ {{ registro.peso_aproximado_tn | toneladas }} c/u
                <span class="texto-secundario">(estimación)</span>
              </span>
              @if (registro.recalculado) {
                <span class="texto-secundario">recalculado</span>
              }
            </li>
          }
        </ul>
      }
      @if (puedeAsociar()) {
        <div class="acciones">
          <button
            mat-stroked-button
            type="button"
            data-prueba="asociar-bigbags"
            (click)="asociarBigbags.emit()"
          >
            <mat-icon>inventory_2</mat-icon>
            Asociar bigbags
          </button>
        </div>
      }
    </section>
  `,
  styles: `
    .titulo {
      margin: 0 0 12px;
      font-size: 1.1rem;
    }
    .subtitulo {
      margin: 16px 0 8px;
      font-size: 1rem;
    }
    .pasos {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .paso {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 2px 14px;
    }
    .acciones {
      margin-top: 12px;
    }
  `,
})
export class RecorridoLoteComponent {
  readonly recorrido = input.required<readonly PasoRecorrido[]>();
  readonly bigbags = input.required<readonly RegistroBigbags[]>();
  readonly partes = input<readonly ParteLote[]>([]);
  /** Hay ensacado registrado y el usuario puede registrar etapas. */
  readonly puedeAsociar = input(false);

  readonly asociarBigbags = output<void>();

  private readonly nombres = computed(() => new Map(this.partes().map((p) => [p.id, p.nombre])));

  protected nombreParte(registro: RegistroBigbags): string {
    return registro.parte === null ? 'Lote completo' : (this.nombres().get(registro.parte) ?? 'Parte');
  }
}
