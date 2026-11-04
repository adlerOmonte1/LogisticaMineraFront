import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  CodigoRuta,
  CuerpoBigbags,
  FraccionParte,
  ParteLote,
  RespuestaLote,
  RutaCatalogo,
  SiguientePaso,
} from '@models/lote.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { DatosDialogoEnvio, DialogoEnvioBase } from '@shared/dialogos/dialogo-envio.base';
import { normalizarDecimal } from '@shared/formularios/validadores';
import { aIsoLima, separarFechaYHoraLima } from '@shared/utils/fecha-hora';
import { sumarFracciones, textoSuma } from '@shared/utils/fraccion';

/** Lo que el usuario llenó para registrar un paso; la página lo convierte en la llamada. */
export interface ValorEtapa {
  ruta: CodigoRuta | null;
  /** ISO con el desfase de Lima, o `null` para que el servidor use «ahora». */
  fecha_hora: string | null;
  horas_molienda: string | null;
  observacion: string;
  bigbags: CuerpoBigbags | null;
  /** Reparto del secado propio de un tardío entre las partes (HU-M06-04 CA09). */
  fracciones: FraccionParte[];
}

export interface DatosDialogoEtapa extends DatosDialogoEnvio<ValorEtapa, RespuestaLote> {
  siguiente: SiguientePaso;
  nombreEtapa: string;
  rutas: readonly RutaCatalogo[];
  partes: readonly ParteLote[];
}

/**
 * Registrar el paso que ofrece «Siguiente paso». Solo pregunta lo que esa etapa necesita: la
 * ruta tras el secado (HU-M06-02 CA02), las horas en la molienda (CA10), los bigbags en el
 * ensacado (CA11) y el reparto entre partes en el secado de un tardío (CA14). La fecha viene en
 * «ahora»: registrar suele ser dos toques (RNF-M06-06). Fechas futuras o anteriores a la etapa
 * previa las rechaza el servidor con su mensaje (CA06 a CA08).
 */
@Component({
  selector: 'app-dialogo-etapa',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AvisoErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ titulo }}</h2>
    <p class="carga texto-secundario" data-prueba="carga">{{ datos.siguiente.carga }}</p>
    <form [formGroup]="formulario" (ngSubmit)="enviar()" novalidate>
      <mat-dialog-content>
        <app-aviso-error [error]="envio.error()" />

        @if (eligeRuta) {
          <mat-form-field class="campo">
            <mat-label>Ruta</mat-label>
            <mat-select formControlName="ruta" data-prueba="ruta">
              @for (ruta of datos.rutas; track ruta.codigo) {
                <mat-option [value]="ruta.codigo">{{ ruta.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field class="campo">
          <mat-label>Fecha y hora</mat-label>
          <input matInput type="datetime-local" formControlName="fecha_hora" data-prueba="fecha-hora" />
        </mat-form-field>

        @if (esMolienda) {
          <mat-form-field class="campo">
            <mat-label>Horas de molienda</mat-label>
            <input
              matInput
              formControlName="horas_molienda"
              inputmode="decimal"
              autocomplete="off"
              data-prueba="horas"
            />
          </mat-form-field>
        }

        @if (esEnsacado) {
          <div [formGroup]="formulario.controls.bigbags">
            <mat-form-field class="campo">
              <mat-label>Bigbags (opcional)</mat-label>
              <input
                matInput
                formControlName="cantidad"
                inputmode="numeric"
                autocomplete="off"
                data-prueba="bigbags"
              />
            </mat-form-field>
            <mat-form-field class="campo">
              <mat-label>Peso aproximado por bigbag (t), opcional</mat-label>
              <input
                matInput
                formControlName="peso"
                inputmode="decimal"
                autocomplete="off"
                data-prueba="peso"
              />
            </mat-form-field>
            <mat-checkbox formControlName="recalcular" data-prueba="recalcular">
              Recalcular el peso aproximado
            </mat-checkbox>
          </div>
        }

        @if (repartir) {
          <h3 class="subtitulo">Reparto entre las partes</h3>
          @for (parte of datos.partes; track parte.id; let i = $index) {
            <mat-form-field class="campo">
              <mat-label>{{ parte.nombre }}</mat-label>
              <input
                matInput
                [formControl]="fracciones.controls[i]"
                autocomplete="off"
                data-prueba="reparto"
              />
            </mat-form-field>
          }
          <p class="suma" [class.suma--aviso]="!suma().completa" role="status" data-prueba="suma">
            Suma: <strong>{{ textoSuma(suma().suma) }}</strong> de 1
          </p>
        }

        <mat-form-field class="campo">
          <mat-label>Observación (opcional)</mat-label>
          <textarea matInput rows="2" formControlName="observacion" data-prueba="observacion"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cerrar()">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="confirmar"
          [disabled]="envio.enviando()"
          data-prueba="enviar"
        >
          Confirmar
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .campo {
      width: 100%;
    }
    .carga {
      margin: -8px 24px 8px;
    }
    .subtitulo {
      margin: 8px 0;
      font-size: 1rem;
    }
    .suma--aviso {
      color: var(--orange);
    }
    .confirmar {
      min-height: var(--altura-toque);
    }
  `,
})
export class DialogoEtapaComponent extends DialogoEnvioBase<ValorEtapa, RespuestaLote, DatosDialogoEtapa> {
  protected readonly textoSuma = textoSuma;

  protected readonly eligeRuta = this.datos.siguiente.elegir_ruta;
  protected readonly esMolienda = this.datos.siguiente.etapa === 'MOLIENDA';
  protected readonly esEnsacado = this.datos.siguiente.etapa === 'ENSACADO';
  /** El secado de un tardío se reparte entre las partes cuando el lote ya está dividido. */
  protected readonly repartir =
    this.datos.siguiente.ingreso !== null &&
    this.datos.siguiente.etapa === 'SECADO' &&
    this.datos.partes.length > 0;

  protected readonly fracciones = new FormArray(
    this.datos.partes.map((p) => new FormControl(p.fraccion, { nonNullable: true })),
  );

  protected readonly formulario = new FormGroup({
    ruta: new FormControl<CodigoRuta | null>(null),
    fecha_hora: new FormControl(ahoraLocal(), { nonNullable: true }),
    horas_molienda: new FormControl('', { nonNullable: true }),
    observacion: new FormControl('', { nonNullable: true }),
    bigbags: new FormGroup({
      cantidad: new FormControl('', { nonNullable: true }),
      peso: new FormControl('', { nonNullable: true }),
      recalcular: new FormControl(false, { nonNullable: true }),
    }),
  });

  private readonly valoresReparto = toSignal(this.fracciones.valueChanges, {
    initialValue: this.fracciones.getRawValue(),
  });
  protected readonly suma = computed(() => sumarFracciones(this.valoresReparto().map((f) => f ?? '')));

  protected enviar(): void {
    const valor = this.formulario.getRawValue();
    const cantidad = Number.parseInt(valor.bigbags.cantidad.trim(), 10);
    this.guardar({
      ruta: this.eligeRuta ? valor.ruta : null,
      // «Ahora» se propone redondeado al minuto: enviarlo tal cual puede quedar antes del paso
      // anterior del mismo minuto. Si el usuario no la tocó, la pone el servidor.
      fecha_hora: this.formulario.controls.fecha_hora.dirty ? aIsoLima(valor.fecha_hora) : null,
      horas_molienda:
        this.esMolienda && valor.horas_molienda.trim()
          ? normalizarDecimal(valor.horas_molienda.trim())
          : null,
      observacion: valor.observacion.trim(),
      bigbags:
        this.esEnsacado && !Number.isNaN(cantidad)
          ? {
              cantidad,
              recalcular: valor.bigbags.recalcular,
              peso_aproximado_tn: valor.bigbags.peso.trim()
                ? normalizarDecimal(valor.bigbags.peso.trim())
                : null,
            }
          : null,
      fracciones: this.repartir
        ? this.datos.partes.map((p, i) => ({
            parte: p.id,
            fraccion: (this.fracciones.at(i).value ?? '').trim(),
          }))
        : [],
    });
  }
}

/** «Ahora» en la zona de la planta, con el formato de un `datetime-local`; solo se muestra. */
function ahoraLocal(): string {
  const { fecha, hora } = separarFechaYHoraLima(new Date().toISOString());
  return `${fecha}T${hora}`;
}
