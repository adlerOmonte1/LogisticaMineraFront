import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CuerpoAsignar, DisponiblesLote, IngresoDisponible, RespuestaLote } from '@models/lote.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { CabeceraDialogoComponent } from '@shared/components/cabecera-dialogo/cabecera-dialogo.component';

export interface DatosDialogoAsignar extends DatosDialogoEnvio<CuerpoAsignar, RespuestaLote> {
  disponibles: DisponiblesLote;
}

/**
 * Asignar ingresos al lote (HU-M06-01 CA04 a CA09, CA14, CA20). Los del mineral del lote van
 * primero; los de otro tipo, agrupados bajo «Agregar de otro tipo de mineral». Si se elige alguno
 * de otro mineral, el campo de autorización aparece **antes** de enviar (CA20); que falte, que el
 * ingreso esté anulado o En proceso, o que no haya selección, lo dice el servidor con su mensaje.
 */
@Component({
  selector: 'app-dialogo-asignar',
  standalone: true,
  imports: [
    CabeceraDialogoComponent,
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    AvisoErrorComponent,
    FechaLimaPipe,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-cabecera-dialogo>{{ titulo }}</app-cabecera-dialogo>
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-dialog-content>
        <app-aviso-error [error]="envio.error()" />

        @if (datos.disponibles.ingresos.length === 0 && datos.disponibles.otros_minerales.length === 0) {
          <p class="texto-secundario" data-prueba="sin-disponibles">
            No hay ingresos disponibles para asignar
          </p>
        }

        @if (datos.disponibles.ingresos.length > 0) {
          <h3 class="grupo">Del mineral del lote</h3>
          <ul class="lista">
            @for (ingreso of datos.disponibles.ingresos; track ingreso.id) {
              <li><ng-container *ngTemplateOutlet="fila; context: { $implicit: ingreso }" /></li>
            }
          </ul>
        }

        @if (datos.disponibles.otros_minerales.length > 0) {
          <h3 class="grupo" data-prueba="otros-minerales">Agregar de otro tipo de mineral</h3>
          @for (grupo of datos.disponibles.otros_minerales; track grupo.tipo_mineral.id) {
            <h4 class="subgrupo">{{ grupo.tipo_mineral.nombre }}</h4>
            <ul class="lista">
              @for (ingreso of grupo.ingresos; track ingreso.id) {
                <li><ng-container *ngTemplateOutlet="fila; context: { $implicit: ingreso }" /></li>
              }
            </ul>
          }
        }

        @if (pideAutorizacion()) {
          <mat-form-field class="campo">
            <mat-label>Autorización para agregar otro mineral</mat-label>
            <textarea matInput rows="2" formControlName="autorizacion" data-prueba="autorizacion"></textarea>
          </mat-form-field>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cerrar()">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          [disabled]="envio.enviando()"
          data-prueba="enviar"
        >
          Asignar{{ seleccion().size > 0 ? ' (' + seleccion().size + ')' : '' }}
        </button>
      </mat-dialog-actions>
    </form>

    <ng-template #fila let-ingreso>
      <mat-checkbox
        [checked]="seleccion().has(ingreso.id)"
        (change)="alternar(ingreso.id)"
        [attr.data-prueba]="'ingreso-' + ingreso.id"
      >
        <span class="monoespaciado">{{ ingreso.codigo }}</span>
        · {{ ingreso.placa }} · {{ ingreso.fecha_hora_pesaje | fechaLima }} ·
        {{ ingreso.peso_neto_tn | toneladas }}
        @if (ingreso.lote_actual) {
          <span class="texto-secundario" data-prueba="lote-actual">· hoy en {{ ingreso.lote_actual }}</span>
        }
      </mat-checkbox>
    </ng-template>
  `,
  styles: `
    .grupo {
      margin: 12px 0 4px;
      font-size: 1rem;
    }
    .subgrupo {
      margin: 8px 0 0;
      font-size: 0.9rem;
      color: var(--label-2);
    }
    .lista {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .campo {
      width: 100%;
      margin-top: 12px;
    }
  `,
})
export class DialogoAsignarComponent extends DialogoEnvioBase<
  CuerpoAsignar,
  RespuestaLote,
  DatosDialogoAsignar
> {
  protected readonly seleccion = signal<ReadonlySet<number>>(new Set());
  protected readonly formulario = new FormGroup({
    autorizacion: new FormControl('', { nonNullable: true }),
  });

  /** Ids de los ingresos de otro mineral: los que exigen autorización. */
  private readonly deOtroMineral = computed(
    () =>
      new Set(
        this.datos.disponibles.otros_minerales.flatMap((g) => g.ingresos.map((i: IngresoDisponible) => i.id)),
      ),
  );

  protected readonly pideAutorizacion = computed(() =>
    [...this.seleccion()].some((id) => this.deOtroMineral().has(id)),
  );

  protected alternar(id: number): void {
    this.seleccion.update((actual) => {
      const nueva = new Set(actual);
      if (!nueva.delete(id)) {
        nueva.add(id);
      }
      return nueva;
    });
  }

  protected enviar(): void {
    this.guardar({
      ingresos: [...this.seleccion()],
      autorizacion: this.pideAutorizacion() ? this.formulario.controls.autorizacion.value.trim() : '',
    });
  }
}
