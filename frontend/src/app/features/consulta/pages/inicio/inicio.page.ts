import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';

import { AutorizacionService } from '@core/autorizacion/autorizacion.service';
import { comoErrorApi } from '@core/errores/error-inesperado';
import { ACCION_PRINCIPAL, NAVEGACION, filtrarPorPermiso } from '@core/layout/navegacion';
import { SesionService } from '@core/sesion/sesion.service';
import { InicioDia } from '@models/consulta.model';
import { ErrorApi } from '@models/error-api.model';
import { AvisoErrorComponent } from '@shared/components/aviso-error/aviso-error.component';
import { EncabezadoPaginaComponent } from '@shared/components/encabezado-pagina/encabezado-pagina.component';
import { ToneladasPipe } from '@shared/pipes/toneladas.pipe';
import { EtiquetaRolPipe } from '@shared/pipes/etiqueta-rol.pipe';
import { ConsultaApiService } from '../../data-access/consulta-api.service';
import { BarrasSemanaComponent } from '../../ui/barras-semana/barras-semana.component';
import { CifraInicioComponent } from '../../ui/cifra-inicio/cifra-inicio.component';
import { TablaIngresosComponent } from '../../ui/tabla-ingresos/tabla-ingresos.component';

/**
 * Pantalla de entrada de cada rol (HU-M01-01 CA01, HU-M07-04): el saludo, la consulta rápida por
 * placa, las cuatro cifras del día, los últimos cinco ingresos y las toneladas de la semana.
 * Cada cifra trae del servidor su enlace, o ninguno si el rol no tiene esa pantalla (CA11). Los
 * avisos de pendientes están en la campana de la cabecera.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    AvisoErrorComponent,
    BarrasSemanaComponent,
    CifraInicioComponent,
    EncabezadoPaginaComponent,
    EtiquetaRolPipe,
    TablaIngresosComponent,
    ToneladasPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
})
export class InicioPage implements OnInit {
  private readonly api = inject(ConsultaApiService);
  private readonly autorizacion = inject(AutorizacionService);
  private readonly router = inject(Router);

  protected readonly usuario = inject(SesionService).usuario;
  protected readonly dia = signal<InicioDia | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<ErrorApi | null>(null);

  protected readonly formulario = new FormGroup({ placa: new FormControl('', { nonNullable: true }) });

  protected readonly accesos = computed(() =>
    filtrarPorPermiso(NAVEGACION, (permiso) => this.autorizacion.puede(permiso)).filter(
      (item) => item.ruta !== '/inicio',
    ),
  );
  protected readonly accionPrincipal = computed(() =>
    this.autorizacion.puede(ACCION_PRINCIPAL.permiso) ? ACCION_PRINCIPAL : null,
  );

  ngOnInit(): void {
    this.cargando.set(true);
    this.api.inicio().subscribe({
      next: (dia) => {
        this.dia.set(dia);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(comoErrorApi(error));
        this.cargando.set(false);
      },
    });
  }

  /** Lleva a la consulta con esa placa (tarea T03): la búsqueda corre al llegar. */
  protected consultar(): void {
    const placa = this.formulario.controls.placa.value.trim();
    void this.router.navigate(['/consulta'], placa ? { queryParams: { placa } } : {});
  }

  protected detalleIngresosHoy(dia: InicioDia): string | null {
    const { cantidad, ultimo, mensaje } = dia.ingresos_hoy;
    return cantidad > 0 && ultimo ? `Último: ${ultimo.hora} · ${ultimo.placa}` : mensaje;
  }

  protected detalleDestares(dia: InicioDia): string | null {
    return dia.pendientes_destare.placas.length > 0 ? dia.pendientes_destare.placas.join(', ') : null;
  }
}
