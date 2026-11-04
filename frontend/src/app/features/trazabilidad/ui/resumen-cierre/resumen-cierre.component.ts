import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { ResumenLote } from '@models/lote.model';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';

/**
 * Resumen que se confirma antes de cerrar (HU-M06-05 CA06): lo registrado, los bigbags, el
 * ensacado aproximado y su diferencia, que **se señala como estimación** y nunca como total
 * (RNF-M06-09); por parte, las toneladas aproximadas y el rendimiento de la molienda en t/h.
 * Lo que falta para cerrar se lista, y es el servidor quien decide si se puede (CA02).
 * Presentacional.
 */
@Component({
  selector: 'app-resumen-cierre',
  standalone: true,
  imports: [MatIconModule, MatTableModule, FechaLimaPipe, ToneladasPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta" aria-labelledby="titulo-resumen">
      <h2 id="titulo-resumen" class="titulo">Resumen para el cierre</h2>

      @if (resumen().pendientes.length > 0) {
        <div class="pendientes" data-prueba="pendientes">
          <strong>Falta para poder cerrar:</strong>
          <ul>
            @for (pendiente of resumen().pendientes; track pendiente) {
              <li>{{ pendiente }}</li>
            }
          </ul>
        </div>
      } @else {
        <p class="listo" data-prueba="listo">
          <mat-icon aria-hidden="true">check_circle</mat-icon>
          No hay pendientes: el lote está listo para cerrar
        </p>
      }

      <dl class="datos">
        <dt>Toneladas registradas</dt>
        <dd class="monoespaciado" data-prueba="registradas">
          {{ resumen().toneladas_registradas | toneladas }}
        </dd>
        <dt>Bigbags</dt>
        <dd data-prueba="bigbags">{{ resumen().bigbags }}</dd>
        <dt>Ensacado aproximado</dt>
        <dd class="monoespaciado" data-prueba="ensacado">
          ≈ {{ resumen().ensacado_aproximado_tn | toneladas }}
          <span class="texto-secundario">(estimación)</span>
        </dd>
        <dt>Diferencia</dt>
        <dd class="monoespaciado" data-prueba="diferencia">
          ≈ {{ resumen().diferencia_tn | toneladas }} <span class="texto-secundario">(estimación)</span>
        </dd>
        <dt>Desde la apertura</dt>
        <dd data-prueba="horas-apertura">{{ horas(resumen().horas_desde_apertura) }}</dd>
        <dt>Desde el inicio del recorrido</dt>
        <dd data-prueba="horas-inicio">{{ horas(resumen().horas_desde_inicio) }}</dd>
        <dt>Último ensacado</dt>
        <dd>{{ resumen().ultimo_ensacado | fechaLima }}</dd>
      </dl>

      <h3 class="subtitulo">Partes</h3>
      <table mat-table [dataSource]="resumen().partes" class="tabla">
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Parte</th>
          <td mat-cell *matCellDef="let parte" data-prueba="parte">{{ parte.nombre }}</td>
        </ng-container>
        <ng-container matColumnDef="fraccion">
          <th mat-header-cell *matHeaderCellDef>Fracción</th>
          <td mat-cell *matCellDef="let parte" data-etiqueta="Fracción">{{ parte.fraccion }}</td>
        </ng-container>
        <ng-container matColumnDef="toneladas">
          <th mat-header-cell *matHeaderCellDef>Toneladas aproximadas</th>
          <td mat-cell *matCellDef="let parte" class="monoespaciado" data-etiqueta="Toneladas">
            ≈ {{ parte.toneladas_aproximadas | toneladas }} <span class="texto-secundario">(estimación)</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="rendimiento">
          <th mat-header-cell *matHeaderCellDef>Molienda</th>
          <td mat-cell *matCellDef="let parte" data-etiqueta="Molienda" data-prueba="rendimiento">
            @if (parte.toneladas_por_hora) {
              {{ parte.toneladas_por_hora }} t/h en {{ parte.horas_molienda }} h
            } @else {
              —
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let parte; columns: columnas"></tr>
      </table>
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
    .pendientes {
      padding: 8px 12px;
      border-radius: 8px;
      color: var(--orange);
      background: color-mix(in srgb, var(--orange-b) 12%, transparent);
    }
    .pendientes ul {
      margin: 4px 0 0;
      padding-left: 20px;
    }
    .listo {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: var(--green);
    }
    .datos {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 6px 16px;
      margin: 16px 0 0;
    }
    .datos dt {
      color: var(--label-3);
    }
    .datos dd {
      margin: 0;
    }
  `,
})
export class ResumenCierreComponent {
  readonly resumen = input.required<ResumenLote>();

  protected readonly columnas = ['nombre', 'fraccion', 'toneladas', 'rendimiento'];

  protected horas(valor: number | null): string {
    return valor === null ? '—' : `${valor} h`;
  }
}
