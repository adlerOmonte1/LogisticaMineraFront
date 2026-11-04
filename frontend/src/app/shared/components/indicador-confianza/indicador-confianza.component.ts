import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Confianza de una lectura del ticket. Un dato dudoso se distingue con icono, texto y el
 * aviso literal del servidor, no solo con color (HU-M04-01 CA02, RNF-M04-09). Sin lectura, el
 * campo queda vacío y editable (CA03).
 */
@Component({
  selector: 'app-indicador-confianza',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (porcentaje() === null) {
      <span class="indicador indicador--vacio"
        ><mat-icon aria-hidden="true">edit</mat-icon>Sin lectura: complete el dato</span
      >
    } @else if (dudoso()) {
      <span class="indicador indicador--dudoso" role="status">
        <mat-icon aria-hidden="true">warning</mat-icon>
        <span>{{ aviso() }} · {{ porcentaje() }} %</span>
      </span>
    } @else {
      <span class="indicador indicador--ok"
        ><mat-icon aria-hidden="true">check_circle</mat-icon>Confianza {{ porcentaje() }} %</span
      >
    }
  `,
  styles: `
    .indicador {
      display: inline-flex;
      align-items: flex-start;
      gap: 4px;
      font-size: 0.8rem;
      line-height: 1.3;
    }
    mat-icon {
      flex: none;
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    .indicador--ok {
      color: var(--green);
    }
    .indicador--dudoso {
      color: var(--orange);
      font-weight: 600;
    }
    .indicador--vacio {
      color: var(--label-2);
    }
  `,
})
export class IndicadorConfianzaComponent {
  readonly confianza = input<number | string | null>(null);
  readonly dudoso = input(false);
  readonly aviso = input<string | null>(null);

  protected readonly porcentaje = computed(() => {
    const valor = this.confianza();
    return valor === null || valor === '' ? null : Math.round(Number(valor) * 100);
  });
}
