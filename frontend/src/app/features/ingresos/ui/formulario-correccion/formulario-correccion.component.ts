import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormBuilder, FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ErrorApi, Inconsistencia } from '@models/error-api.model';
import { CambiosIngreso, Ingreso } from '@models/ingreso.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { aplicarErrorEnFormulario } from '@shared/formularios/errores-formulario';
import { decimalPositivo, normalizarDecimal } from '@shared/formularios/validadores';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { cambiosRespectoDe } from '@shared/utils/cambios';
import { separarFechaYHoraLima } from '@shared/utils/fecha-hora';
import { normalizarPlaca } from '@shared/utils/placa';
import { ListaInconsistenciasComponent } from '../lista-inconsistencias/lista-inconsistencias.component';
import { asegurarJustificaciones } from '../revision-ingreso/formulario-revision';

export interface DatosCorreccion {
  /** Solo lo que cambió: el servidor ignora el resto y rechaza «sin cambios» (HU-M03-02 CA04, CA10). */
  cambios: CambiosIngreso;
  motivo: string;
  justificaciones: Record<string, string>;
}

type ValorFormulario = Required<Omit<CambiosIngreso, 'tipo_mineral'>> & { tipo_mineral: number | null };

/**
 * La corrección de un ingreso registrado (HU-M03-02): los campos corregibles, el motivo y, si
 * una regla lo reclama, su justificación. No ofrece el código, las marcas de tiempo, la tara ni
 * el peso neto: los asigna el servidor (CA04). Las reglas las responde el servidor (D-F23).
 */
@Component({
  selector: 'app-formulario-correccion',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
    ListaInconsistenciasComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './formulario-correccion.component.html',
})
export class FormularioCorreccionComponent implements OnInit {
  readonly ingreso = input.required<Ingreso>();
  readonly tiposMineral = input.required<readonly TipoMineral[]>();
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);

  readonly enviar = output<DatosCorreccion>();
  readonly cancelar = output<void>();

  protected readonly formulario = inject(FormBuilder).group({
    placa: [''],
    fecha: [''],
    hora: [''],
    peso_bruto_tn: ['', decimalPositivo()],
    tipo_mineral: [null as number | null],
    motivo: [''],
    justificaciones: new FormRecord<FormControl<string>>({}),
  });

  /** El tipo de mineral actual aunque se haya dado de baja: no se pierde al corregir otro dato. */
  protected readonly opcionesMineral = computed<TipoMineral[]>(() => {
    const ingreso = this.ingreso();
    const opciones = [...this.tiposMineral()];
    if (!opciones.some((tipo) => tipo.id === ingreso.tipo_mineral)) {
      opciones.unshift({
        id: ingreso.tipo_mineral,
        codigo: ingreso.tipo_mineral_codigo,
        nombre: ingreso.tipo_mineral_nombre,
        unidad_medida: 'TONELADA',
        activo: false,
      });
    }
    return opciones;
  });

  protected readonly porCampo = computed(() => this.agruparPorCampo(this.error()?.inconsistencias ?? []));
  protected readonly faltantes = computed(() => this.error()?.justificacionesFaltantes ?? []);

  constructor() {
    effect(() => {
      const error = this.error();
      if (!error) {
        return;
      }
      untracked(() => {
        aplicarErrorEnFormulario(this.formulario, error);
        asegurarJustificaciones(
          this.formulario.controls.justificaciones,
          error.inconsistencias.filter((i) => i.exige_justificacion).map((i) => i.regla),
        );
      });
    });
  }

  ngOnInit(): void {
    this.formulario.patchValue(this.valoresOriginales());
  }

  protected corregir(): void {
    if (this.formulario.controls.peso_bruto_tn.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { motivo, justificaciones, ...campos } = this.formulario.getRawValue();
    const nuevos: ValorFormulario = {
      placa: normalizarPlaca(campos.placa ?? ''),
      fecha: campos.fecha ?? '',
      hora: campos.hora ?? '',
      peso_bruto_tn: normalizarDecimal(campos.peso_bruto_tn ?? ''),
      tipo_mineral: campos.tipo_mineral,
    };
    const { tipo_mineral, ...restantes } = cambiosRespectoDe<ValorFormulario>(
      this.valoresOriginales(),
      nuevos,
    );
    this.enviar.emit({
      // Un tipo de mineral vacío no es un cambio: el servidor lo reclamaría como dato ausente.
      cambios: { ...restantes, ...(tipo_mineral ? { tipo_mineral } : {}) },
      motivo: (motivo ?? '').trim(),
      justificaciones: Object.fromEntries(
        Object.entries(justificaciones).filter(([, texto]) => texto.trim() !== ''),
      ),
    });
  }

  private valoresOriginales(): ValorFormulario {
    const ingreso = this.ingreso();
    const { fecha, hora } = separarFechaYHoraLima(ingreso.fecha_hora_pesaje);
    return {
      placa: ingreso.placa,
      fecha,
      hora,
      peso_bruto_tn: ingreso.peso_bruto_tn,
      tipo_mineral: ingreso.tipo_mineral,
    };
  }

  private agruparPorCampo(inconsistencias: readonly Inconsistencia[]): Map<string, Inconsistencia[]> {
    const porCampo = new Map<string, Inconsistencia[]>();
    for (const inconsistencia of inconsistencias) {
      porCampo.set(inconsistencia.campo, [...(porCampo.get(inconsistencia.campo) ?? []), inconsistencia]);
    }
    return porCampo;
  }
}
