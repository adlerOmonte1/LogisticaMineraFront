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
import { RouterLink, RouterLinkActive } from '@angular/router';

import { comoErrorApi } from '@core/errores/error-inesperado';
import { DetalleIngreso } from '@models/detalle-ingreso.model';
import { ErrorApi } from '@models/error-api.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { ConsultaApiService } from '../../data-access/consulta-api.service';
import { TicketImagen } from '../../data-access/ticket-imagen';
import { CabeceraIngresoComponent } from '../../ui/cabecera-ingreso/cabecera-ingreso.component';
import { PestanaDatosComponent } from '../../ui/pestana-datos/pestana-datos.component';
import { PestanaTrazabilidadComponent } from '../../ui/pestana-trazabilidad/pestana-trazabilidad.component';
import { PestanaHistorialComponent } from '../../ui/pestana-historial/pestana-historial.component';
import { PestanaReconocimientoComponent } from '../../ui/pestana-reconocimiento/pestana-reconocimiento.component';
import { PestanaTicketComponent } from '../../ui/pestana-ticket/pestana-ticket.component';
import { PestanaValidacionComponent } from '../../ui/pestana-validacion/pestana-validacion.component';

type Pestana = 'datos' | 'ticket' | 'reconocimiento' | 'validacion' | 'trazabilidad' | 'historial';

const PESTANAS: readonly { ruta: Pestana; etiqueta: string }[] = [
  { ruta: 'datos', etiqueta: 'Datos' },
  { ruta: 'ticket', etiqueta: 'Ticket' },
  { ruta: 'reconocimiento', etiqueta: 'Reconocimiento' },
  { ruta: 'validacion', etiqueta: 'Validación' },
  { ruta: 'trazabilidad', etiqueta: 'Trazabilidad' },
  { ruta: 'historial', etiqueta: 'Historial' },
];

/**
 * Detalle de un ingreso, con una sola llamada para todas sus pestañas (RNF-M07-02). La
 * pestaña es parte de la URL, así se puede enlazar directo. `id` y
 * `pestana` llegan de la ruta (`withComponentInputBinding`).
 */
@Component({
  selector: 'app-detalle-ingreso',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatProgressBarModule,
    AvisoErrorComponent,
    CabeceraIngresoComponent,
    PestanaDatosComponent,
    PestanaTicketComponent,
    PestanaReconocimientoComponent,
    PestanaValidacionComponent,
    PestanaTrazabilidadComponent,
    PestanaHistorialComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detalle-ingreso.page.html',
  styles: `
    .pestanas {
      display: flex;
      max-width: 100%;
      margin-bottom: 16px;
      overflow-x: auto;
      border: 1px solid var(--stroke);
      border-radius: 4px;
      background: var(--surface);
      scrollbar-width: none;
      width: max-content;
      a {
        padding: 7px 15px;
        border-right: 1px solid var(--stroke);
        color: var(--label-2);
        font-size: 13.5px;
        font-weight: 500;
        text-decoration: none;
        white-space: nowrap;
        &:last-child {
          border-right: 0;
        }
        &:hover {
          background: var(--hover);
          color: var(--label);
        }
        &.on {
          background: var(--ink);
          color: #fff;
          font-weight: 600;
        }
      }
    }
  `,
})
export class DetalleIngresoPage {
  readonly id = input.required<string>();
  readonly pestana = input<string | undefined>();

  private readonly api = inject(ConsultaApiService);

  protected readonly pestanas = PESTANAS;
  protected readonly detalle = signal<DetalleIngreso | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<ErrorApi | null>(null);
  protected readonly ticket = new TicketImagen(this.api, inject(DestroyRef));

  protected readonly pestanaActiva = computed<Pestana>(
    () => PESTANAS.find((p) => p.ruta === this.pestana())?.ruta ?? 'datos',
  );

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
    // La imagen se descarga la primera vez que se abre su pestaña, no al abrir el detalle.
    effect(() => {
      const detalle = this.detalle();
      if (this.pestanaActiva() === 'ticket' && detalle?.respaldo.tipo === 'IMAGEN') {
        untracked(() => this.ticket.cargar(detalle.id));
      }
    });
  }

  private cargar(id: number): void {
    this.ticket.liberar();
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
}
