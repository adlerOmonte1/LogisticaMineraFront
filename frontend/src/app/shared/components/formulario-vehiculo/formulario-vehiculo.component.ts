import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ErrorApi } from '@models/error-api.model';
import { Transportista } from '@models/transportista.model';
import { ETIQUETA_TITULARIDAD, NuevoVehiculo, Titularidad, Vehiculo } from '@models/vehiculo.model';
import { aplicarErrorEnFormulario } from '../../formularios/errores-formulario';
import { decimalPositivo, normalizarDecimal } from '../../formularios/validadores';
import { ErrorCampoPipe } from '../../pipes/error-campo.pipe';
import { normalizarPlaca } from '../../utils/placa';
import { AvisoErrorComponent } from '../aviso-error/aviso-error.component';

type OpcionTransportista = Pick<Transportista, 'id' | 'razon_social'>;

/**
 * Datos de un vehículo: placa, titularidad, capacidad y, si es externo, transportista
 * (HU-M02-01). Lo usan el catálogo y el alta desde el registro de un ingreso (FB3), por eso
 * vive en `shared/` y no inyecta servicios. Sin tara: el vehículo nace pendiente de destare.
 *
 * El patrón de placa y la obligación del transportista los valida el servidor con sus
 * mensajes literales (D-24, CA03, CA04): el cliente no los adelanta.
 */
@Component({
  selector: 'app-formulario-vehiculo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    AvisoErrorComponent,
    ErrorCampoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './formulario-vehiculo.component.html',
})
export class FormularioVehiculoComponent implements OnInit {
  readonly vehiculo = input<Vehiculo | null>(null);
  readonly transportistas = input<readonly Transportista[]>([]);
  /** Placa leída del ticket, para el alta desde el registro. */
  readonly placaSugerida = input<string | null>(null);
  readonly error = input<ErrorApi | null>(null);
  readonly enviando = input(false);
  readonly textoEnviar = input('Guardar');

  readonly enviar = output<NuevoVehiculo>();
  readonly cancelar = output<void>();

  protected readonly titularidades: readonly Titularidad[] = ['PROPIO', 'EXTERNO'];
  protected readonly etiquetaTitularidad = ETIQUETA_TITULARIDAD;

  protected readonly formulario = inject(FormBuilder).group({
    placa: ['', Validators.required],
    tipo_titularidad: ['PROPIO' as Titularidad, Validators.required],
    capacidad_tn: ['', [Validators.required, decimalPositivo()]],
    transportista: [null as number | null],
  });

  private readonly titularidad = toSignal(this.formulario.controls.tipo_titularidad.valueChanges, {
    initialValue: this.formulario.controls.tipo_titularidad.value,
  });
  protected readonly esExterno = computed(() => this.titularidad() === 'EXTERNO');

  /** Incluye el transportista actual aunque esté de baja, para no perderlo al editar. */
  protected readonly opcionesTransportista = computed<OpcionTransportista[]>(() => {
    const vigentes: OpcionTransportista[] = [...this.transportistas()];
    const vehiculo = this.vehiculo();
    if (vehiculo?.transportista && !vigentes.some((t) => t.id === vehiculo.transportista)) {
      vigentes.push({ id: vehiculo.transportista, razon_social: vehiculo.transportista_nombre ?? '—' });
    }
    return vigentes;
  });

  constructor() {
    effect(() => {
      const error = this.error();
      if (error) {
        aplicarErrorEnFormulario(this.formulario, error);
      }
    });
  }

  ngOnInit(): void {
    const vehiculo = this.vehiculo();
    if (vehiculo) {
      this.formulario.patchValue({
        placa: vehiculo.placa,
        tipo_titularidad: vehiculo.titularidad,
        capacidad_tn: vehiculo.capacidad_tn,
        transportista: vehiculo.transportista,
      });
    } else if (this.placaSugerida()) {
      this.formulario.patchValue({ placa: normalizarPlaca(this.placaSugerida() ?? '') });
    }
  }

  protected normalizarPlaca(): void {
    const control = this.formulario.controls.placa;
    control.setValue(normalizarPlaca(control.value ?? ''), { emitEvent: false });
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { placa, tipo_titularidad, capacidad_tn, transportista } = this.formulario.getRawValue();
    const titularidad = tipo_titularidad ?? 'PROPIO';
    this.enviar.emit({
      placa: normalizarPlaca(placa ?? ''),
      tipo_titularidad: titularidad,
      capacidad_tn: normalizarDecimal(capacidad_tn ?? ''),
      transportista: titularidad === 'EXTERNO' ? transportista : null,
    });
  }
}
