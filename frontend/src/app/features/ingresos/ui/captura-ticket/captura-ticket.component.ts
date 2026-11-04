import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ErrorApi } from '@models/error-api.model';
import { MOTIVOS_SIN_FOTO, MotivoSinFoto } from '@models/ingreso.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';

/**
 * Paso 1 del registro: fotografiar el ticket, elegir una imagen o registrar sin foto, todo en
 * la misma pantalla (RNF-M03-17). Presentacional: emite el archivo o el motivo.
 */
@Component({
  selector: 'app-captura-ticket',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    AvisoErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './captura-ticket.component.html',
  styleUrl: './captura-ticket.component.scss',
})
export class CapturaTicketComponent {
  readonly procesando = input(false);
  readonly error = input<ErrorApi | null>(null);
  /** Hay una imagen guardada cuyo envío falló: se ofrece reintentar sin volver a fotografiar. */
  readonly hayImagenPendiente = input(false);

  readonly imagenElegida = output<File>();
  readonly sinFoto = output<MotivoSinFoto>();
  readonly reintentar = output<void>();

  protected readonly motivos = MOTIVOS_SIN_FOTO;
  protected readonly modoSinFoto = signal(false);
  protected readonly arrastrando = signal(false);
  protected readonly motivo = new FormControl<MotivoSinFoto | null>(null, Validators.required);

  protected alElegirArchivo(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.item(0);
    campo.value = '';
    if (archivo) {
      this.imagenElegida.emit(archivo);
    }
  }

  protected alSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(false);
    const archivo = evento.dataTransfer?.files.item(0);
    if (archivo && !this.procesando()) {
      this.imagenElegida.emit(archivo);
    }
  }

  protected alArrastrarSobre(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando.set(true);
  }

  protected continuarSinFoto(): void {
    this.motivo.markAsTouched();
    if (this.motivo.value) {
      this.sinFoto.emit(this.motivo.value);
    }
  }
}
