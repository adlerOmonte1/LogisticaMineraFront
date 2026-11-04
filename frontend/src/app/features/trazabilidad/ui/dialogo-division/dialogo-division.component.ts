import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CodigoRuta, ParteNueva, RespuestaLote, RutaCatalogo } from '@models/lote.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { sumarFracciones, textoSuma } from '@shared/utils/fraccion';

export interface DatosDialogoDivision extends DatosDialogoEnvio<ParteNueva[], RespuestaLote> {
  rutas: readonly RutaCatalogo[];
}

/** De 2 a 6 partes (HU-M06-04 CA05): el formulario no deja agregar la séptima. */
export const MIN_PARTES = 2;
export const MAX_PARTES = 6;

function nuevaParte(): FormGroup<{
  nombre: FormControl<string>;
  fraccion: FormControl<string>;
  ruta: FormControl<CodigoRuta | ''>;
}> {
  return new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    fraccion: new FormControl('', { nonNullable: true }),
    ruta: new FormControl<CodigoRuta | ''>('', { nonNullable: true }),
  });
}

/**
 * Dividir el lote en partes, cada una con su nombre, su fracción (`1/3`, `0.5`) y su ruta.
 * Mientras se escribe se muestra la suma y cuánto falta para la unidad (RNF-M06-10, HU-M06-04
 * CA04); el aviso no bloquea el envío: quien lo rechaza, con su mensaje literal, es el servidor
 * (partes incompletas, nombres repetidos, fracciones que no suman).
 */
@Component({
  selector: 'app-dialogo-division',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    AvisoErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-dialog-content>
        <app-aviso-error [error]="envio.error()" />
        @for (parte of partes.controls; track parte; let i = $index) {
          <div class="parte" [formGroup]="parte" data-prueba="parte">
            <mat-form-field>
              <mat-label>Nombre de la parte {{ i + 1 }}</mat-label>
              <input matInput formControlName="nombre" autocomplete="off" data-prueba="nombre" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Fracción</mat-label>
              <input
                matInput
                formControlName="fraccion"
                inputmode="text"
                autocomplete="off"
                data-prueba="fraccion"
              />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Ruta</mat-label>
              <mat-select formControlName="ruta" data-prueba="ruta">
                @for (ruta of datos.rutas; track ruta.codigo) {
                  <mat-option [value]="ruta.codigo">{{ ruta.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (partes.length > minimo) {
              <button
                mat-icon-button
                type="button"
                data-prueba="quitar-parte"
                [attr.aria-label]="'Quitar la parte ' + (i + 1)"
                (click)="quitar(i)"
              >
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        }
        <button
          mat-button
          type="button"
          data-prueba="agregar-parte"
          [disabled]="partes.length >= maximo"
          (click)="agregar()"
        >
          <mat-icon>add</mat-icon>
          Agregar parte
        </button>

        <p class="suma" [class.suma--aviso]="!suma().completa" role="status" data-prueba="suma">
          Suma de las fracciones: <strong>{{ textoSuma(suma().suma) }}</strong> de 1
          @if (suma().hayIlegibles) {
            · hay una fracción que no se entiende
          } @else if (!suma().completa) {
            ·
            {{
              suma().falta > 0
                ? 'faltan ' + textoSuma(suma().falta)
                : 'se pasa por ' + textoSuma(-suma().falta)
            }}
          }
        </p>
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
          Dividir
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .parte {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0 12px;
      align-items: start;
    }
    @media (min-width: 600px) {
      .parte {
        grid-template-columns: 2fr 1fr 2fr auto;
      }
    }
    .suma {
      margin: 12px 0 0;
    }
    .suma--aviso {
      color: var(--orange);
    }
  `,
})
export class DialogoDivisionComponent extends DialogoEnvioBase<
  ParteNueva[],
  RespuestaLote,
  DatosDialogoDivision
> {
  protected readonly minimo = MIN_PARTES;
  protected readonly maximo = MAX_PARTES;
  protected readonly textoSuma = textoSuma;

  protected readonly partes = new FormArray([nuevaParte(), nuevaParte()]);
  protected readonly formulario = new FormGroup({ partes: this.partes });

  private readonly valores = toSignal(this.partes.valueChanges, { initialValue: this.partes.getRawValue() });
  protected readonly suma = computed(() => sumarFracciones(this.valores().map((p) => p.fraccion ?? '')));

  protected agregar(): void {
    if (this.partes.length < MAX_PARTES) {
      this.partes.push(nuevaParte());
    }
  }

  protected quitar(indice: number): void {
    if (this.partes.length > MIN_PARTES) {
      this.partes.removeAt(indice);
    }
  }

  protected enviar(): void {
    this.guardar(
      this.partes
        .getRawValue()
        .map((p) => ({ nombre: p.nombre.trim(), fraccion: p.fraccion.trim(), ruta: p.ruta })),
    );
  }
}
