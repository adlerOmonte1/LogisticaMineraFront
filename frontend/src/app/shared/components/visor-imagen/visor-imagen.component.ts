import { ChangeDetectionStrategy, Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type EstadoVisor = 'cargando' | 'listo' | 'error';

/**
 * Imagen del ticket, ampliable (HU-M07-01 CA03). Presentacional: recibe la URL ya resuelta —un
 * `blob:` de la imagen local o de la descarga autenticada (D-F14)— y no sabe de dónde viene.
 * La ampliación usa `<dialog>` nativo, que ya trae foco, Escape y fondo modal.
 */
@Component({
  selector: 'app-visor-imagen',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visor-imagen.component.html',
  styleUrl: './visor-imagen.component.scss',
})
export class VisorImagenComponent {
  readonly src = input<string | null>(null);
  readonly alt = input('Ticket de balanza');
  readonly estado = input<EstadoVisor>('listo');

  protected readonly tamanoReal = signal(false);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected ampliar(): void {
    this.tamanoReal.set(false);
    this.dialogo().nativeElement.showModal();
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected alternarTamano(): void {
    this.tamanoReal.update((real) => !real);
  }
}
