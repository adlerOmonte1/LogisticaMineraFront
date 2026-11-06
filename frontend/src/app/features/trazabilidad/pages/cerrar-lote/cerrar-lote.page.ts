import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { filter, forkJoin } from 'rxjs';

import { DialogosService } from '@core/dialogos/dialogos.service';
import { comoErrorApi } from '@core/errores/error-inesperado';
import { NotificacionService } from '@core/notificacion/notificacion.service';
import { ErrorApi } from '@models/error-api.model';
import { CodigoDestino, DestinoCatalogo, Lote, ResumenLote } from '@models/lote.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { EnvioFormulario } from '@shared/formularios/envio-formulario';
import { ErrorCampoPipe } from '@shared/pipes/error-campo.pipe';
import { FechaLimaPipe } from '@shared/pipes/fecha-lima.pipe';
import { CatalogoRecorridoApiService } from '../../data-access/catalogo-recorrido-api.service';
import { LotesApiService } from '../../data-access/lotes-api.service';
import { ResumenCierreComponent } from '../../ui/resumen-cierre/resumen-cierre.component';
import { AvisoFranjaComponent } from '@shared/components/aviso-franja/aviso-franja.component';

/**
 * Resumen y cierre de un lote con su destino (HU-M06-05), solo el Administrador, con la
 * disposición de `pAlta` en la maqueta (D-F45): el aviso según su estado, el formulario de
 * cierre, las cifras con la diferencia como estimación (CA06), los tiempos, el resultado por
 * parte y el recorrido. Al cerrar pide una confirmación final. Con pendientes o sin destino responde el servidor con su mensaje
 * literal (CA02, CA03); el cliente no los anticipa.
 */
@Component({
  selector: 'app-cerrar-lote',
  standalone: true,
  imports: [
    AvisoFranjaComponent,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    AvisoErrorComponent,
    EncabezadoPaginaComponent,
    ErrorCampoPipe,
    FechaLimaPipe,
    ResumenCierreComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cerrar-lote.page.html',
  styles: `
    .sin-margen {
      margin: 0;
    }
    .acciones {
      justify-content: flex-end;
    }
  `,
})
export class CerrarLotePage {
  readonly id = input.required<string>();

  private readonly api = inject(LotesApiService);
  private readonly catalogoApi = inject(CatalogoRecorridoApiService);
  private readonly dialogos = inject(DialogosService);
  private readonly notificacion = inject(NotificacionService);
  private readonly router = inject(Router);

  protected readonly lote = signal<Lote | null>(null);
  protected readonly resumen = signal<ResumenLote | null>(null);
  protected readonly destinos = signal<DestinoCatalogo[]>([]);
  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal<ErrorApi | null>(null);
  protected readonly envio = new EnvioFormulario();

  protected readonly formulario = new FormGroup({
    destino: new FormControl<CodigoDestino | null>(null),
    observacion: new FormControl('', { nonNullable: true }),
  });

  protected readonly subtitulo = computed(() => {
    const lote = this.lote();
    return lote ? [lote.codigo, ...lote.composicion.map((g) => g.tipo_mineral.nombre)].join(', ') : '';
  });

  /** Un lote ya cerrado no ofrece cerrar otra vez (HU-M06-05 CA04). */
  protected readonly cerrable = computed(() => this.lote()?.estado === 'EN_RECORRIDO');

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.cargar(id));
    });
  }

  protected cerrar(): void {
    const lote = this.lote();
    if (!lote) {
      return;
    }
    const { destino, observacion } = this.formulario.getRawValue();
    const nombreDestino = this.destinos().find((d) => d.codigo === destino)?.nombre;
    this.dialogos
      .confirmar({
        titulo: `¿Cerrar ${lote.nombre}?`,
        mensaje: nombreDestino
          ? `El lote queda cerrado con destino «${nombreDestino}» y ya no admite cambios.`
          : 'El lote queda cerrado y ya no admite cambios.',
        textoConfirmar: 'Cerrar lote',
        advertencia: true,
      })
      .pipe(filter(Boolean))
      .subscribe(() =>
        this.envio.ejecutar(
          this.api.cerrar(lote.id, { destino, observacion: observacion.trim() }),
          (respuesta) => {
            if (respuesta.mensaje) {
              this.notificacion.exito(respuesta.mensaje);
            }
            void this.router.navigate(['/lotes', lote.id]);
          },
          this.formulario,
        ),
      );
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    forkJoin({
      lote: this.api.obtener(id),
      resumen: this.api.resumen(id),
      catalogo: this.catalogoApi.catalogo(),
    }).subscribe({
      next: ({ lote, resumen, catalogo }) => {
        this.lote.set(lote);
        this.resumen.set(resumen);
        this.destinos.set(catalogo.destinos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.errorCarga.set(comoErrorApi(error));
        this.cargando.set(false);
      },
    });
  }
}
