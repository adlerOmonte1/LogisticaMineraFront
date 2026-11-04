import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { startWith, switchMap } from 'rxjs';

import { ErrorApi, Inconsistencia } from '@models/error-api.model';
import { MOTIVOS_SIN_FOTO } from '@models/ingreso.model';
import {
  BorradorIngreso,
  CamposRegistro,
  CampoReconocidoPropuesto,
  ConsultaVehiculo,
  JustificacionesPorRegla,
  NombreCampoReconocido,
} from '@models/registro-ingreso.model';
import { TipoMineral } from '@models/tipo-mineral.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { VisorImagenComponent } from '@shared/components/visor-imagen/visor-imagen.component';
import { aplicarErrorEnFormulario } from '@shared/formularios/errores-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { aCentesimas } from '@shared/utils/decimal';
import { normalizarPlaca } from '@shared/utils/placa';
import { ListaInconsistenciasComponent } from '../lista-inconsistencias/lista-inconsistencias.component';
import { EstadoLectura, NotaLecturaComponent } from '../nota-lectura.component';
import { ResumenVehiculoComponent } from '../resumen-vehiculo/resumen-vehiculo.component';
import {
  FormularioRevision,
  asegurarJustificaciones,
  camposDe,
  justificacionesDe,
} from './formulario-revision';

export interface ConfirmacionDeRevision {
  campos: CamposRegistro;
  justificaciones: JustificacionesPorRegla;
}

/** Campo de la revisión → campo reconocido que lo propuso. */
const CAMPO_RECONOCIDO: Readonly<Record<string, NombreCampoReconocido>> = {
  placa: 'PLACA',
  fecha: 'FECHA',
  peso_bruto_tn: 'PESO_BRUTO',
};

/**
 * Paso 2 del registro: una sola pantalla para revisar lo reconocido con su confianza, las
 * inconsistencias junto a su campo y confirmar (docs/pantallas.md §4.3). Presentacional: el
 * formulario y el estado los aporta la página; aquí solo se pintan y se emiten las acciones.
 */
@Component({
  selector: 'app-revision-ingreso',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    AvisoErrorComponent,
    VisorImagenComponent,
    ErrorCampoPipe,
    ListaInconsistenciasComponent,
    NotaLecturaComponent,
    ResumenVehiculoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './revision-ingreso.component.html',
  styleUrl: './revision-ingreso.component.scss',
})
export class RevisionIngresoComponent {
  readonly propuesta = input.required<BorradorIngreso>();
  readonly formulario = input.required<FormularioRevision>();
  readonly tiposMineral = input.required<readonly TipoMineral[]>();
  readonly consultaVehiculo = input<ConsultaVehiculo | null>(null);
  readonly imagenUrl = input<string | null>(null);
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);

  readonly confirmar = output<ConfirmacionDeRevision>();
  readonly repetirCaptura = output<void>();
  readonly registrarVehiculo = output<string>();
  readonly agregarTipoMineral = output<void>();

  /** Lo que valía el formulario cuando se evaluaron las inconsistencias que se muestran. */
  private readonly valoresEvaluados = computed<Partial<CamposRegistro>>(() => {
    const propuesta = this.propuesta().propuesta;
    return {
      placa: propuesta.placa ?? '',
      fecha: propuesta.fecha ?? '',
      peso_bruto_tn: propuesta.peso_bruto_tn ?? '',
    };
  });
  /** Tras un rechazo, lo que se evaluó fue lo que se envió: el formulario en ese momento. */
  private readonly evaluadoTrasRechazo = computed<Partial<CamposRegistro> | null>(() =>
    this.error()?.inconsistencias.length ? untracked(() => camposDe(this.formulario())) : null,
  );

  /** El valor actual del formulario, como signal, para que lo derivado reaccione a cada tecla. */
  protected readonly valores = toSignal(
    toObservable(this.formulario).pipe(
      switchMap((formulario) => formulario.valueChanges.pipe(startWith(formulario.getRawValue()))),
    ),
  );
  protected readonly placaActual = computed(() => normalizarPlaca(this.valores()?.placa ?? ''));
  protected readonly pesoActual = computed(() => this.valores()?.peso_bruto_tn ?? '');

  protected readonly inconsistencias = computed<readonly Inconsistencia[]>(() => {
    const rechazo = this.error()?.inconsistencias ?? [];
    return rechazo.length > 0 ? rechazo : this.propuesta().inconsistencias;
  });
  protected readonly faltantes = computed(() => this.error()?.justificacionesFaltantes ?? []);
  protected readonly inconsistenciasPorCampo = computed(() => {
    const porCampo = new Map<string, Inconsistencia[]>();
    for (const inconsistencia of this.inconsistencias()) {
      porCampo.set(inconsistencia.campo, [...(porCampo.get(inconsistencia.campo) ?? []), inconsistencia]);
    }
    return porCampo;
  });
  protected readonly sinCampo = computed(() =>
    this.inconsistencias().filter((i) => !(i.campo in CAMPO_RECONOCIDO) && i.campo !== 'hora'),
  );

  /** Reglas cuyo campo cambió desde que se evaluaron (D-F19: se revalidan al confirmar). */
  protected readonly porRevalidar = computed<string[]>(() => {
    const evaluados = this.evaluadoTrasRechazo() ?? this.valoresEvaluados();
    const actuales = this.valores();
    return this.inconsistencias()
      .filter((i) => {
        const clave = i.campo as keyof CamposRegistro;
        return (
          actuales !== undefined &&
          clave in evaluados &&
          !mismoValor(clave, actuales[clave], evaluados[clave])
        );
      })
      .map((i) => i.regla);
  });

  protected readonly motivoSinFoto = computed(
    () => MOTIVOS_SIN_FOTO.find((m) => m.codigo === this.propuesta().motivo_sin_respaldo)?.etiqueta ?? null,
  );
  protected readonly avisoLectura = computed(() => this.propuesta().reconocimiento?.aviso ?? null);
  protected readonly horaEsPropuesta = computed(
    () =>
      this.propuesta().propuesta.hora_es_propuesta &&
      this.valores()?.hora === this.propuesta().propuesta.hora,
  );
  /** El aviso del servidor sobre la placa vale solo mientras sea la placa que se reconoció. */
  protected readonly avisoPlaca = computed(() =>
    this.placaActual() === normalizarPlaca(this.propuesta().propuesta.placa ?? '')
      ? this.propuesta().aviso_placa
      : null,
  );

  constructor() {
    // El rechazo del servidor se pinta en los campos que señala (mensajes literales).
    effect(() => {
      const error = this.error();
      if (error) {
        aplicarErrorEnFormulario(this.formulario(), error);
      }
    });
    // Cada regla que exige justificación necesita su caja en el formulario.
    effect(() => {
      const reglas = this.inconsistencias()
        .filter((i) => i.exige_justificacion)
        .map((i) => i.regla);
      asegurarJustificaciones(untracked(this.formulario).controls.justificaciones, reglas);
    });
  }

  protected campoReconocido(nombre: string): CampoReconocidoPropuesto | null {
    return this.propuesta().reconocimiento?.campos.find((c) => c.nombre === CAMPO_RECONOCIDO[nombre]) ?? null;
  }

  protected estadoLectura(nombre: string): EstadoLectura {
    const campo = this.campoReconocido(nombre);
    if (!campo) {
      return 'ninguna';
    }
    const actual = this.valores()?.[nombre as keyof CamposRegistro];
    if (campo.valor === null) {
      return actual ? 'corregido' : 'sin-lectura';
    }
    if (!mismoValor(nombre as keyof CamposRegistro, actual, campo.valor)) {
      return 'corregido';
    }
    return campo.dudoso ? 'dudoso' : 'ok';
  }

  protected normalizarPlaca(): void {
    const control = this.formulario().controls.placa;
    control.setValue(normalizarPlaca(control.value), { emitEvent: true });
  }

  protected enviar(): void {
    const formulario = this.formulario();
    if (formulario.controls.peso_bruto_tn.invalid) {
      formulario.markAllAsTouched();
      return;
    }
    this.confirmar.emit({ campos: camposDe(formulario), justificaciones: justificacionesDe(formulario) });
  }
}

/** Compara dos valores de un campo: los pesos por su valor numérico, la placa sin mayúsculas. */
function mismoValor(campo: keyof CamposRegistro, a: unknown, b: unknown): boolean {
  const x = String(a ?? '').trim();
  const y = String(b ?? '').trim();
  if (campo === 'peso_bruto_tn') {
    return aCentesimas(x) === aCentesimas(y) && (aCentesimas(x) !== null || x === y);
  }
  return campo === 'placa' ? normalizarPlaca(x) === normalizarPlaca(y) : x === y;
}
