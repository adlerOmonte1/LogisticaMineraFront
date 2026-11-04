import { Directive, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';

import { comoErrorApi } from '@core/errores/error-inesperado';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { ErrorApi } from '@models/error-api.model';
import { Ingreso } from '@models/ingreso.model';
import { ConMensaje } from '@models/pagina.model';
import { EnvioFormulario } from '@shared/formularios/envio-formulario';
import { IngresosApiService } from '../data-access/ingresos-api.service';

/**
 * Lo común de las tres acciones sobre un ingreso ya registrado —corregir, revertir y anular—:
 * cargar el ingreso de la ruta, mostrar el rechazo literal del servidor y, al terminar, avisar
 * con su mensaje y volver al detalle (método plantilla). Cada página decide **qué** envía.
 */
@Directive()
export abstract class PaginaAccionSobreIngreso {
  /** Llega de la ruta `/ingresos/:id/...` (`withComponentInputBinding`). */
  readonly id = input.required<string>();

  protected readonly api = inject(IngresosApiService);
  private readonly router = inject(Router);
  private readonly notificacion = inject(NotificacionService);

  protected readonly ingreso = signal<Ingreso | null>(null);
  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal<ErrorApi | null>(null);
  protected readonly envio = new EnvioFormulario();

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargarIngreso(id));
    });
  }

  protected volverAlDetalle(): void {
    void this.router.navigate(['/consulta/ingresos', this.id()]);
  }

  /** El servidor aceptó la acción: su mensaje es el aviso y se vuelve al detalle. */
  protected terminar(respuesta: ConMensaje<Ingreso>): void {
    if (respuesta.mensaje) {
      this.notificacion.exito(respuesta.mensaje);
    }
    this.volverAlDetalle();
  }

  /** Gancho para que una página prepare lo que necesita cuando el ingreso llega. */
  protected alCargarIngreso(_ingreso: Ingreso): void {
    // Por defecto no hace nada.
  }

  private cargarIngreso(id: number): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.ingreso.set(null);
    this.envio.limpiar();
    this.api.obtener(id).subscribe({
      next: (ingreso) => {
        this.ingreso.set(ingreso);
        this.cargando.set(false);
        this.alCargarIngreso(ingreso);
      },
      error: (error: unknown) => {
        this.errorCarga.set(comoErrorApi(error));
        this.cargando.set(false);
      },
    });
  }
}
