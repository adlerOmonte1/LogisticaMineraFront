import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { comoErrorApi } from '@core/errores/error-inesperado';
import { DetalleIngreso } from '@models/detalle-ingreso.model';
import { ErrorApi } from '@models/error-api.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { ConsultaApiService } from '../../data-access/consulta-api.service';
import { CabeceraIngresoComponent } from '../../ui/cabecera-ingreso/cabecera-ingreso.component';
import { PestanaDatosComponent } from '../../ui/pestana-datos/pestana-datos.component';
import { PestanaReconocimientoComponent } from '../../ui/pestana-reconocimiento/pestana-reconocimiento.component';
import { PestanaTicketComponent } from '../../ui/pestana-ticket/pestana-ticket.component';
import { PestanaValidacionComponent } from '../../ui/pestana-validacion/pestana-validacion.component';

type Pestana = 'datos' | 'ticket' | 'reconocimiento' | 'validacion';

const PESTANAS: readonly { ruta: Pestana; etiqueta: string }[] = [
  { ruta: 'datos', etiqueta: 'Datos' },
  { ruta: 'ticket', etiqueta: 'Ticket' },
  { ruta: 'reconocimiento', etiqueta: 'Reconocimiento' },
  { ruta: 'validacion', etiqueta: 'Validación' },
];

/**
 * Detalle de un ingreso, con una sola llamada para todas sus pestañas (RNF-M07-02). La
 * pestaña es parte de la URL, así se puede enlazar directo. En FB4 y FB5 se suman Historial y
 * Trazabilidad. `id` y `pestana` llegan de la ruta (`withComponentInputBinding`).
 */
@Component({
  selector: 'app-detalle-ingreso',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatProgressBarModule,
    MatTabsModule,
    AvisoErrorComponent,
    CabeceraIngresoComponent,
    PestanaDatosComponent,
    PestanaTicketComponent,
    PestanaReconocimientoComponent,
    PestanaValidacionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-ingreso.page.html',
})
export class DetalleIngresoPage {
  readonly id = input.required<string>();
  readonly pestana = input<string | undefined>();

  private readonly api = inject(ConsultaApiService);

  protected readonly pestanas = PESTANAS;
  protected readonly detalle = signal<DetalleIngreso | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<ErrorApi | null>(null);
  protected readonly urlTicket = signal<string | null>(null);
  protected readonly falloTicket = signal(false);

  protected readonly pestanaActiva = computed<Pestana>(
    () => PESTANAS.find((p) => p.ruta === this.pestana())?.ruta ?? 'datos',
  );

  private urlObjeto: string | null = null;
  private ticketSolicitadoDe: number | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.liberarTicket());
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
    // La imagen se descarga la primera vez que se abre su pestaña, no al abrir el detalle.
    effect(() => {
      const detalle = this.detalle();
      if (this.pestanaActiva() === 'ticket' && detalle?.respaldo.tipo === 'IMAGEN') {
        untracked(() => this.cargarTicket(detalle.id));
      }
    });
  }

  private cargar(id: number): void {
    this.liberarTicket();
    this.cargando.set(true);
    this.error.set(null);
    this.detalle.set(null);
    this.api.detalleIngreso(id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(comoErrorApi(error));
        this.cargando.set(false);
      },
    });
  }

  private cargarTicket(id: number): void {
    if (this.ticketSolicitadoDe === id) {
      return;
    }
    this.ticketSolicitadoDe = id;
    this.falloTicket.set(false);
    this.api.ticketIngreso(id).subscribe({
      next: (imagen) => {
        this.urlObjeto = URL.createObjectURL(imagen);
        this.urlTicket.set(this.urlObjeto);
      },
      error: () => this.falloTicket.set(true),
    });
  }

  private liberarTicket(): void {
    if (this.urlObjeto) {
      URL.revokeObjectURL(this.urlObjeto);
      this.urlObjeto = null;
    }
    this.urlTicket.set(null);
    this.ticketSolicitadoDe = null;
  }
}
